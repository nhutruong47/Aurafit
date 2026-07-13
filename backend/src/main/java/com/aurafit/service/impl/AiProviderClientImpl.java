package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.dto.ai.RecommendationReasoningInput;
import com.aurafit.service.AiChatContext;
import com.aurafit.service.AiProviderClient;
import com.aurafit.service.RecommendationReasoningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiProviderClientImpl implements AiProviderClient {

    private static final Logger logger = LoggerFactory.getLogger(AiProviderClientImpl.class);

    private final AiProviderProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final HttpClient reasoningHttpClient;
    private final AiPromptTemplateService aiPromptTemplateService;

    public AiProviderClientImpl(AiProviderProperties properties,
                                ObjectMapper objectMapper,
                                AiPromptTemplateService aiPromptTemplateService) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.aiPromptTemplateService = aiPromptTemplateService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(500, properties.getProviderConnectTimeoutMillis())))
                .build();
        this.reasoningHttpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(500, properties.getReasoningConnectTimeoutMillis())))
                .build();
        logger.info(
                "AI provider runtime config: baseUrl={}, chatModel={}, apiKey={}",
                normalizeBaseUrl(properties.getProviderBaseUrl()),
                safe(properties.getChatModel()),
                maskApiKey(properties.getProviderApiKey())
        );
    }

    @Override
    public String understandIntent(IntentUnderstandingPrompt prompt) {
        if (prompt == null || prompt.chatContext() == null
                || prompt.chatContext().latestUserMessage() == null
                || prompt.chatContext().latestUserMessage().isBlank()) {
            throw new IllegalArgumentException("latestUserMessage is required for AI intent understanding.");
        }

        String responseContent = requestChatCompletion(
                "intent_understanding",
                writeIntentRequestBody(prompt),
                httpClient,
                properties.getProviderReadTimeoutMillis()
        );
        return extractJson(responseContent);
    }

    @Override
    public String reasonRecommendations(RecommendationReasoningPrompt prompt) {
        if (prompt == null || prompt.input() == null || prompt.input().candidatePool() == null) {
            throw new IllegalArgumentException("Recommendation reasoning input is required.");
        }

        String responseContent = requestChatCompletion(
                "recommendation_reasoning",
                writeRecommendationReasoningRequestBody(prompt),
                reasoningHttpClient,
                properties.getReasoningReadTimeoutMillis()
        );
        return extractJson(responseContent);
    }

    @Override
    public List<String> generateRecommendationExplanations(RecommendationExplanationPrompt prompt) {
        if (prompt == null || prompt.items() == null || prompt.items().isEmpty()) {
            return List.of();
        }

        String responseContent = requestChatCompletion(
                prompt.surface(),
                writeRecommendationRequestBody(prompt),
                httpClient,
                properties.getProviderReadTimeoutMillis()
        );

        try {
            return parseReasons(prompt, responseContent);
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot parse AI explanation response.", exception);
        }
    }

    private String requestChatCompletion(String surface,
                                         String requestBody,
                                         HttpClient client,
                                         int readTimeoutMillis) {
        int attempts = Math.max(1, properties.getProviderMaxRetries() + 1);
        URI uri = URI.create(normalizeBaseUrl(properties.getProviderBaseUrl()) + "/chat/completions");

        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder(uri)
                        .timeout(Duration.ofMillis(Math.max(1000, readTimeoutMillis)))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + properties.getProviderApiKey().trim())
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                int statusCode = response.statusCode();
                if (statusCode >= 200 && statusCode < 300) {
                    return readResponseContent(response.body());
                }

                if (!isRetryableStatus(statusCode) || attempt == attempts) {
                    throw new IllegalStateException("AI provider returned HTTP " + statusCode + ".");
                }

                logger.warn("AI provider returned retryable status {} on attempt {} for surface {}.",
                        statusCode, attempt, surface);
                backoff(attempt);
            } catch (HttpTimeoutException exception) {
                if (attempt == attempts) {
                    logger.warn(
                            "AI provider timeout on final attempt {} for surface {}. Root exception type={}, message={}",
                            attempt,
                            surface,
                            exception.getClass().getName(),
                            exception.getMessage(),
                            exception
                    );
                    throw new IllegalStateException("AI provider request timed out.", exception);
                }
                logger.warn(
                        "AI provider timed out on attempt {} for surface {}. Root exception type={}, message={}",
                        attempt,
                        surface,
                        exception.getClass().getName(),
                        exception.getMessage(),
                        exception
                );
                backoff(attempt);
            } catch (IOException exception) {
                if (attempt == attempts) {
                    logger.warn(
                            "AI provider I/O failure on final attempt {} for surface {}. Root exception type={}, message={}",
                            attempt,
                            surface,
                            exception.getClass().getName(),
                            exception.getMessage(),
                            exception
                    );
                    throw new IllegalStateException("AI provider request failed due to I/O error.", exception);
                }
                logger.warn(
                        "AI provider I/O failure on attempt {} for surface {}. Root exception type={}, message={}",
                        attempt,
                        surface,
                        exception.getClass().getName(),
                        exception.getMessage(),
                        exception
                );
                backoff(attempt);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("AI provider request was interrupted.", exception);
            }
        }

        throw new IllegalStateException("AI provider failed unexpectedly.");
    }

    private String writeIntentRequestBody(IntentUnderstandingPrompt prompt) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", properties.getChatModel());
            payload.put("temperature", 0.0);
            payload.put("max_tokens", 250);
            payload.put("messages", List.of(
                    Map.of(
                            "role", "system",
                            "content", aiPromptTemplateService.composeIntentUnderstandingSystemPrompt()
                    ),
                    Map.of(
                            "role", "user",
                            "content", objectMapper.writeValueAsString(buildIntentPromptPayload(prompt))
                    )
            ));
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot serialize AI intent understanding request.", exception);
        }
    }

    private String writeRecommendationReasoningRequestBody(RecommendationReasoningPrompt prompt) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", properties.getChatModel());
            payload.put("temperature", 0.1);
            payload.put("max_tokens", 900);
            payload.put("messages", List.of(
                    Map.of(
                            "role", "system",
                            "content", aiPromptTemplateService.composeRecommendationReasoningSystemPrompt(
                                    prompt.mode() == null
                                            ? RecommendationReasoningService.RecommendationReasoningMode.AI_STYLIST_CHAT
                                            : prompt.mode()
                            )
                    ),
                    Map.of(
                            "role", "user",
                            "content", objectMapper.writeValueAsString(buildRecommendationReasoningPayload(prompt))
                    )
            ));
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot serialize AI recommendation reasoning request.", exception);
        }
    }

    private Map<String, Object> buildIntentPromptPayload(IntentUnderstandingPrompt prompt) {
        AiChatContext chatContext = prompt.chatContext();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("latestUserMessage", chatContext.latestUserMessage().trim());
        payload.put("previousUserMessage", safe(chatContext.previousUserMessage()));
        payload.put("previousAssistantSummary", safe(chatContext.previousAssistantSummary()));
        payload.put("lastDetectedIntent", safe(chatContext.lastDetectedIntent()));
        payload.put("lastUserNeedSummary", safe(chatContext.lastUserNeedSummary()));
        payload.put("lastRecommendedProducts", chatContext.lastRecommendedProducts().stream()
                .map(item -> {
                    Map<String, Object> product = new LinkedHashMap<>();
                    product.put("productId", item.productId());
                    product.put("productName", safe(item.productName()));
                    product.put("price", item.price());
                    product.put("reason", safe(item.reason()));
                    product.put("score", item.score());
                    product.put("category", safe(item.category()));
                    product.put("style", safe(item.style()));
                    product.put("occasion", safe(item.occasion()));
                    product.put("color", safe(item.color()));
                    product.put("availableItemCount", item.availableItemCount());
                    return product;
                })
                .toList());
        payload.put("recentMessages", chatContext.recentMessages().stream()
                .map(message -> Map.of(
                        "role", safe(message.role()),
                        "content", safe(limit(message.content(), 180))
                ))
                .toList());
        payload.put("conversationSummary", safe(chatContext.conversationSummary()));
        payload.put("hasPreviousRecommendation", chatContext.hasPreviousRecommendation());
        payload.put("likelyFollowUp", chatContext.likelyFollowUp());
        return payload;
    }

    private Map<String, Object> buildRecommendationReasoningPayload(RecommendationReasoningPrompt prompt) {
        RecommendationReasoningInput input = prompt.input();
        return objectMapper.convertValue(input, objectMapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, Object.class));
    }

    private String writeRecommendationRequestBody(RecommendationExplanationPrompt prompt) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", properties.getChatModel());
            payload.put("temperature", 0.2);
            payload.put("max_tokens", 500);
            payload.put("messages", List.of(
                    Map.of(
                            "role", "system",
                            "content", aiPromptTemplateService.composeRecommendationExplanationSystemPrompt(prompt)
                    ),
                    Map.of(
                            "role", "user",
                            "content", objectMapper.writeValueAsString(buildRecommendationPromptPayload(prompt))
                    )
            ));
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot serialize AI explanation request.", exception);
        }
    }

    private Map<String, Object> buildRecommendationPromptPayload(RecommendationExplanationPrompt prompt) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("surface", safe(prompt.surface()));
        payload.put("contextSummary", safe(prompt.contextSummary()));
        payload.put("replyLanguage", safe(prompt.replyLanguage()));
        payload.put("userMessageExcerpt", safe(limit(prompt.userMessageExcerpt(), 220)));
        payload.put("detectedIntentJson", safe(prompt.detectedIntentJson()));
        payload.put("conversationSummary", prompt.chatContext() != null ? safe(prompt.chatContext().conversationSummary()) : "");
        payload.put("recentMessages", prompt.chatContext() == null ? List.of() : prompt.chatContext().recentMessages().stream()
                .map(message -> Map.of(
                        "role", safe(message.role()),
                        "content", safe(limit(message.content(), 180))
                ))
                .toList());
        payload.put("lastRecommendedProducts", prompt.chatContext() == null ? List.of() : prompt.chatContext().lastRecommendedProducts().stream()
                .map(item -> {
                    Map<String, Object> product = new LinkedHashMap<>();
                    product.put("productName", safe(item.productName()));
                    product.put("reason", safe(item.reason()));
                    product.put("score", item.score());
                    product.put("style", safe(item.style()));
                    product.put("occasion", safe(item.occasion()));
                    product.put("color", safe(item.color()));
                    return product;
                })
                .toList());
        payload.put("items", prompt.items().stream()
                .map(item -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("costumeId", item.costumeId());
                    row.put("costumeName", safe(item.costumeName()));
                    row.put("categoryName", safe(item.categoryName()));
                    row.put("description", safe(limit(item.description(), 220)));
                    row.put("style", safe(item.style()));
                    row.put("occasion", safe(item.occasion()));
                    row.put("season", safe(item.season()));
                    row.put("color", safe(item.color()));
                    row.put("tags", item.tags() == null ? List.of() : item.tags());
                    row.put("availableItemCount", item.availableItemCount());
                    row.put("originalReason", safe(item.originalReason()));
                    return row;
                })
                .toList());
        return payload;
    }

    private List<String> parseReasons(RecommendationExplanationPrompt prompt, String responseContent) throws IOException {
        JsonNode arrayNode = objectMapper.readTree(extractJson(responseContent));
        if (!arrayNode.isArray()) {
            throw new IllegalStateException("AI provider response is not a JSON array.");
        }

        Map<Long, String> reasonsById = new LinkedHashMap<>();
        for (JsonNode itemNode : arrayNode) {
            Long costumeId = parseLong(itemNode.path("costumeId"));
            String reason = normalizeReason(itemNode.path("reason").asText(null));
            if (costumeId != null && reason != null) {
                reasonsById.put(costumeId, reason);
            }
        }

        List<String> orderedReasons = new ArrayList<>();
        for (RecommendationExplanationItem item : prompt.items()) {
            orderedReasons.add(reasonsById.get(item.costumeId()));
        }
        return orderedReasons;
    }

    private String readResponseContent(String responseBody) throws IOException {
        JsonNode responseNode = objectMapper.readTree(responseBody);
        JsonNode contentNode = responseNode.path("choices").path(0).path("message").path("content");
        if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
            throw new IllegalStateException("AI provider response content is empty.");
        }
        return contentNode.asText();
    }

    private boolean isRetryableStatus(int statusCode) {
        return statusCode == 408 || statusCode == 429 || statusCode >= 500;
    }

    private void backoff(int attempt) {
        try {
            Thread.sleep(150L * attempt);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI provider retry was interrupted.", exception);
        }
    }

    private String extractJson(String content) {
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                trimmed = trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private Long parseLong(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.canConvertToLong()) {
            return node.asLong();
        }
        try {
            return Long.parseLong(node.asText().trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private String normalizeReason(String reason) {
        if (reason == null) {
            return null;
        }
        String trimmed = reason.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > 180) {
            trimmed = trimmed.substring(0, 180).trim();
        }
        return trimmed;
    }

    private String normalizeBaseUrl(String baseUrl) {
        String trimmed = baseUrl == null ? "" : baseUrl.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null) {
            return "null";
        }

        String trimmed = apiKey.trim();
        if (trimmed.isEmpty()) {
            return "blank(length=0)";
        }

        int length = trimmed.length();
        String prefix = trimmed.substring(0, Math.min(4, length));
        String suffix = trimmed.substring(Math.max(0, length - 4));
        return "length=" + length + ", startsWith=" + prefix + ", endsWith=" + suffix;
    }
}
