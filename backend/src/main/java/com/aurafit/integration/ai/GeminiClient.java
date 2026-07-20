package com.aurafit.integration.ai;

import com.aurafit.enums.AiCallType;
import com.aurafit.enums.AiErrorType;
import com.aurafit.exception.AiProviderException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.handler.timeout.ReadTimeoutException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Service
@Slf4j
public class GeminiClient {

    private static final String RATE_LIMIT_MESSAGE =
            "Hệ thống đang được nhiều người sử dụng, vui lòng thử lại sau ít phút";
    private static final String AUTH_ERROR_MESSAGE =
            "Hệ thống tư vấn AI đang tạm thời gián đoạn, vui lòng thử lại sau";
    private static final String TIMEOUT_MESSAGE =
            "Phản hồi hơi lâu, bạn thử gửi lại câu hỏi nhé";
    private static final String INVALID_RESPONSE_MESSAGE =
            "Có chút trục trặc khi xử lý câu trả lời, bạn thử hỏi lại theo cách khác nhé";
    private static final String PROVIDER_UNAVAILABLE_MESSAGE =
            "Dịch vụ tư vấn AI đang tạm thời không khả dụng, vui lòng thử lại sau";
    private static final String UNKNOWN_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại";
    private static final int INTENT_MAX_OUTPUT_TOKENS = 300;
    private static final int RESPONSE_MAX_OUTPUT_TOKENS = 400;
    private static final int INSIGHT_MAX_OUTPUT_TOKENS = 500;

    private final WebClient webClient;
    private final String apiKey;
    private final String model;
    private final Duration timeout;
    private final int thinkingBudget;
    private final ObjectMapper objectMapper;

    public GeminiClient(
            WebClient.Builder webClientBuilder,
            @Value("${ai.gemini.api-key:}") String apiKey,
            @Value("${ai.gemini.model:gemini-3.5-flash}") String model,
            @Value("${ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            @Value("${ai.gemini.timeout-ms:15000}") long timeoutMs,
            @Value("${ai.gemini.thinking-budget:0}") int thinkingBudget,
            ObjectMapper objectMapper
    ) {
        String resolvedBaseUrl = StringUtils.hasText(baseUrl)
                ? baseUrl.trim()
                : "https://generativelanguage.googleapis.com/v1beta";
        this.webClient = webClientBuilder.baseUrl(resolvedBaseUrl).build();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = StringUtils.hasText(model)
                ? model.replaceAll("\\s+", "")
                : "gemini-3.5-flash";
        this.timeout = Duration.ofMillis(timeoutMs);
        this.thinkingBudget = thinkingBudget;
        this.objectMapper = objectMapper;
    }

    public String generateJson(String systemPrompt, String userPrompt) {
        return generateJson(AiCallType.INTENT_EXTRACTION, systemPrompt, userPrompt);
    }

    public String generateJson(AiCallType callType, String systemPrompt, String userPrompt) {
        return generate(callType, systemPrompt, userPrompt, true);
    }

    public String generateText(String systemPrompt, String userPrompt) {
        return generateText(AiCallType.RESPONSE_GENERATION, systemPrompt, userPrompt);
    }

    public String generateText(AiCallType callType, String systemPrompt, String userPrompt) {
        return generate(callType, systemPrompt, userPrompt, false);
    }

    private String generate(
            AiCallType callType,
            String systemPrompt,
            String userPrompt,
            boolean jsonResponse
    ) {
        AiCallType resolvedCallType = callType == null ? AiCallType.RESPONSE_GENERATION : callType;
        int estimatedInputTokens = estimateTokens(systemPrompt, userPrompt);
        int inputCharacters = characterCount(systemPrompt) + characterCount(userPrompt);
        int maxOutputTokens = resolveMaxOutputTokens(resolvedCallType, jsonResponse);

        if (!StringUtils.hasText(apiKey)) {
            AiProviderException exception = new AiProviderException(
                    AiErrorType.AUTH_ERROR,
                    "Gemini API key is not configured.",
                    AUTH_ERROR_MESSAGE
            );
            log.error(
                    "Gemini call failed type={} inputChars={} estimatedInputTokens={} maxOutputTokens={} "
                            + "httpStatus={} responseBody={} reason=not_configured",
                    resolvedCallType,
                    inputCharacters,
                    estimatedInputTokens,
                    maxOutputTokens,
                    "N/A",
                    "N/A",
                    exception
            );
            throw exception;
        }

        long startedAt = System.nanoTime();
        String responseBody = null;
        try {
            responseBody = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/models/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(model))
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(buildRequestBody(systemPrompt, userPrompt, jsonResponse, maxOutputTokens))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(timeout)
                    .block();

            JsonNode response = StringUtils.hasText(responseBody)
                    ? objectMapper.readTree(responseBody)
                    : null;
            String output = extractResponseText(response);
            log.info(
                    "Gemini call completed type={} inputChars={} outputChars={} estimatedInputTokens={} estimatedOutputTokens={} maxOutputTokens={} durationMs={}",
                    resolvedCallType,
                    inputCharacters,
                    characterCount(output),
                    estimatedInputTokens,
                    estimateTokens(output),
                    maxOutputTokens,
                    elapsedMillis(startedAt)
            );
            return output;
        } catch (WebClientResponseException exception) {
            AiProviderException mappedException = mapHttpException(exception);
            logFailure(
                    resolvedCallType,
                    inputCharacters,
                    estimatedInputTokens,
                    maxOutputTokens,
                    startedAt,
                    exception.getStatusCode().value(),
                    exception.getResponseBodyAsString(),
                    mappedException.getErrorType(),
                    exception
            );
            throw mappedException;
        } catch (AiProviderException exception) {
            logFailure(
                    resolvedCallType,
                    inputCharacters,
                    estimatedInputTokens,
                    maxOutputTokens,
                    startedAt,
                    null,
                    responseBody,
                    exception.getErrorType(),
                    exception
            );
            throw exception;
        } catch (Exception exception) {
            AiProviderException mappedException = mapNonHttpException(exception);
            logFailure(
                    resolvedCallType,
                    inputCharacters,
                    estimatedInputTokens,
                    maxOutputTokens,
                    startedAt,
                    null,
                    responseBody,
                    mappedException.getErrorType(),
                    exception
            );
            throw mappedException;
        }
    }

    private AiProviderException mapHttpException(WebClientResponseException exception) {
        int statusCode = exception.getStatusCode().value();
        AiErrorType errorType;
        String userFriendlyMessage;

        if (statusCode == 429) {
            errorType = AiErrorType.RATE_LIMIT_EXCEEDED;
            userFriendlyMessage = RATE_LIMIT_MESSAGE;
        } else if (statusCode == 401 || statusCode == 403) {
            errorType = AiErrorType.AUTH_ERROR;
            userFriendlyMessage = AUTH_ERROR_MESSAGE;
        } else if (statusCode >= 500 && statusCode < 600) {
            errorType = AiErrorType.PROVIDER_UNAVAILABLE;
            userFriendlyMessage = PROVIDER_UNAVAILABLE_MESSAGE;
        } else if (statusCode == 400 || statusCode == 422) {
            errorType = AiErrorType.INVALID_RESPONSE;
            userFriendlyMessage = INVALID_RESPONSE_MESSAGE;
        } else {
            errorType = AiErrorType.UNKNOWN;
            userFriendlyMessage = UNKNOWN_ERROR_MESSAGE;
        }

        return new AiProviderException(
                errorType,
                exception.getMessage(),
                userFriendlyMessage,
                exception
        );
    }

    private AiProviderException mapNonHttpException(Exception exception) {
        if (hasCause(exception, JsonProcessingException.class)) {
            return new AiProviderException(
                    AiErrorType.INVALID_RESPONSE,
                    exception.getMessage(),
                    INVALID_RESPONSE_MESSAGE,
                    exception
            );
        }

        if (hasCause(exception, TimeoutException.class)
                || hasCause(exception, ReadTimeoutException.class)) {
            return new AiProviderException(
                    AiErrorType.TIMEOUT,
                    exception.getMessage(),
                    TIMEOUT_MESSAGE,
                    exception
            );
        }

        if (hasCause(exception, WebClientRequestException.class)) {
            return new AiProviderException(
                    AiErrorType.PROVIDER_UNAVAILABLE,
                    exception.getMessage(),
                    PROVIDER_UNAVAILABLE_MESSAGE,
                    exception
            );
        }

        return new AiProviderException(
                AiErrorType.UNKNOWN,
                exception.getMessage(),
                UNKNOWN_ERROR_MESSAGE,
                exception
        );
    }

    private boolean hasCause(Throwable exception, Class<? extends Throwable> causeType) {
        Throwable current = exception;
        while (current != null) {
            if (causeType.isInstance(current)) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private void logFailure(
            AiCallType callType,
            int inputCharacters,
            int estimatedInputTokens,
            int maxOutputTokens,
            long startedAt,
            Integer httpStatus,
            String responseBody,
            AiErrorType errorType,
            Throwable exception
    ) {
        log.error(
                "Gemini call failed type={} inputChars={} estimatedInputTokens={} maxOutputTokens={} "
                        + "durationMs={} errorType={} httpStatus={} responseBody={}",
                callType,
                inputCharacters,
                estimatedInputTokens,
                maxOutputTokens,
                elapsedMillis(startedAt),
                errorType,
                httpStatus == null ? "N/A" : httpStatus,
                responseBody == null ? "N/A" : responseBody,
                exception
        );
    }

    private Map<String, Object> buildRequestBody(
            String systemPrompt,
            String userPrompt,
            boolean jsonResponse,
            int maxOutputTokens
    ) {
        Map<String, Object> requestBody = new LinkedHashMap<>();

        if (StringUtils.hasText(systemPrompt)) {
            requestBody.put("systemInstruction", Map.of(
                    "parts", List.of(Map.of("text", systemPrompt))
            ));
        }

        requestBody.put("contents", List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userPrompt))
        )));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        if (thinkingBudget >= 0) {
            generationConfig.put("thinkingConfig", Map.of("thinkingBudget", thinkingBudget));
        }
        if (jsonResponse) {
            generationConfig.put("responseMimeType", MediaType.APPLICATION_JSON_VALUE);
        }
        requestBody.put("generationConfig", generationConfig);

        return requestBody;
    }

    private int resolveMaxOutputTokens(AiCallType callType, boolean jsonResponse) {
        if (jsonResponse || callType == AiCallType.INTENT_EXTRACTION) {
            return INTENT_MAX_OUTPUT_TOKENS;
        }
        if (callType == AiCallType.INSIGHT) {
            return INSIGHT_MAX_OUTPUT_TOKENS;
        }
        return RESPONSE_MAX_OUTPUT_TOKENS;
    }

    private int estimateTokens(String... values) {
        int characters = 0;
        for (String value : values) {
            characters += characterCount(value);
        }
        return characters == 0 ? 0 : (characters + 3) / 4;
    }

    private int characterCount(String value) {
        return value == null ? 0 : value.length();
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    private String extractResponseText(JsonNode response) {
        JsonNode candidate = response == null ? null : response.path("candidates").path(0);
        if (candidate == null || candidate.isMissingNode()) {
            throw new AiProviderException(
                    AiErrorType.INVALID_RESPONSE,
                    "Gemini response does not contain candidates[0].",
                    INVALID_RESPONSE_MESSAGE
            );
        }

        String finishReason = candidate.path("finishReason").asText("");
        if ("MAX_TOKENS".equalsIgnoreCase(finishReason)) {
            throw new AiProviderException(
                    AiErrorType.INVALID_RESPONSE,
                    "Gemini response reached the maximum output token limit.",
                    INVALID_RESPONSE_MESSAGE
            );
        }

        JsonNode parts = candidate.path("content").path("parts");
        StringBuilder output = new StringBuilder();
        if (parts.isArray()) {
            parts.forEach(part -> {
                JsonNode textNode = part.path("text");
                if (!part.path("thought").asBoolean(false) && textNode.isTextual()) {
                    if (!output.isEmpty()) {
                        output.append('\n');
                    }
                    output.append(textNode.asText());
                }
            });
        }

        if (output.isEmpty()) {
            throw new AiProviderException(
                    AiErrorType.INVALID_RESPONSE,
                    "Gemini response does not contain a non-thinking text part.",
                    INVALID_RESPONSE_MESSAGE
            );
        }

        return output.toString();
    }
}
