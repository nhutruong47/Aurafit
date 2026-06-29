package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.service.AiProviderClient;
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
import java.util.Locale;
import java.util.Map;

@Service
public class AiProviderClientImpl implements AiProviderClient {

    private static final Logger logger = LoggerFactory.getLogger(AiProviderClientImpl.class);

    private final AiProviderProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiProviderClientImpl(AiProviderProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(500, properties.getProviderConnectTimeoutMillis())))
                .build();
    }

    @Override
    public List<String> generateRecommendationExplanations(RecommendationExplanationPrompt prompt) {
        if (prompt == null || prompt.items() == null || prompt.items().isEmpty()) {
            return List.of();
        }

        int attempts = Math.max(1, properties.getProviderMaxRetries() + 1);
        URI uri = URI.create(normalizeBaseUrl(properties.getProviderBaseUrl()) + "/chat/completions");
        String requestBody = writeRequestBody(prompt);

        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder(uri)
                        .timeout(Duration.ofMillis(Math.max(1000, properties.getProviderReadTimeoutMillis())))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + properties.getProviderApiKey().trim())
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                int statusCode = response.statusCode();
                if (statusCode >= 200 && statusCode < 300) {
                    return parseReasons(prompt, response.body());
                }

                if (!isRetryableStatus(statusCode) || attempt == attempts) {
                    throw new IllegalStateException("AI provider returned HTTP " + statusCode + ".");
                }

                logger.warn("AI explanation provider returned retryable status {} on attempt {} for surface {}.",
                        statusCode, attempt, prompt.surface());
                backoff(attempt);
            } catch (HttpTimeoutException exception) {
                if (attempt == attempts) {
                    throw new IllegalStateException("AI explanation request timed out.", exception);
                }
                logger.warn("AI explanation provider timed out on attempt {} for surface {}.", attempt, prompt.surface());
                backoff(attempt);
            } catch (IOException exception) {
                if (attempt == attempts) {
                    throw new IllegalStateException("AI explanation request failed due to I/O error.", exception);
                }
                logger.warn("AI explanation provider I/O failure on attempt {} for surface {}.", attempt, prompt.surface());
                backoff(attempt);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("AI explanation request was interrupted.", exception);
            }
        }

        throw new IllegalStateException("AI explanation provider failed unexpectedly.");
    }

    private String writeRequestBody(RecommendationExplanationPrompt prompt) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", properties.getChatModel());
            payload.put("temperature", 0.2);
            payload.put("max_tokens", 500);
            payload.put("messages", List.of(
                    Map.of(
                            "role", "system",
                            "content", """
                                    Bạn là trợ lý viết lời giải thích recommendation cho AuraFit.
                                    Nhiệm vụ của bạn chỉ là viết lại lý do gợi ý thành câu ngắn gọn, rõ ràng, bằng tiếng Việt có dấu.
                                    Không thay đổi ranking. Không bịa thông tin không có trong dữ liệu.
                                    Mỗi lý do tối đa 1 câu ngắn.
                                    Trả về JSON array thuần, mỗi phần tử có dạng:
                                    {"costumeId":123,"reason":"..."}
                                    Không thêm markdown, không thêm giải thích ngoài JSON.
                                    """
                    ),
                    Map.of(
                            "role", "user",
                            "content", objectMapper.writeValueAsString(buildPromptPayload(prompt))
                    )
            ));
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot serialize AI explanation request.", exception);
        }
    }

    private Map<String, Object> buildPromptPayload(RecommendationExplanationPrompt prompt) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("surface", safe(prompt.surface()));
        payload.put("contextSummary", safe(prompt.contextSummary()));
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

    private List<String> parseReasons(RecommendationExplanationPrompt prompt, String responseBody) throws IOException {
        JsonNode responseNode = objectMapper.readTree(responseBody);
        JsonNode contentNode = responseNode.path("choices").path(0).path("message").path("content");
        if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
            throw new IllegalStateException("AI provider response content is empty.");
        }

        String jsonPayload = extractJson(contentNode.asText());
        JsonNode arrayNode = objectMapper.readTree(jsonPayload);
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

    private boolean isRetryableStatus(int statusCode) {
        return statusCode == 408 || statusCode == 429 || statusCode >= 500;
    }

    private void backoff(int attempt) {
        try {
            Thread.sleep(150L * attempt);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI explanation retry was interrupted.", exception);
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
}
