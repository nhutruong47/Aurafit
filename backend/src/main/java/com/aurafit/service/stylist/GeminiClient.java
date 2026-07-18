package com.aurafit.service.stylist;

import com.aurafit.exception.AiProviderException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiClient {

    private static final String PROVIDER_ERROR_MESSAGE = "AI provider request failed.";
    private static final int INTENT_MAX_OUTPUT_TOKENS = 300;
    private static final int RESPONSE_MAX_OUTPUT_TOKENS = 400;
    private static final int INSIGHT_MAX_OUTPUT_TOKENS = 500;

    private final WebClient webClient;
    private final String apiKey;
    private final String model;
    private final Duration timeout;

    public GeminiClient(
            WebClient.Builder webClientBuilder,
            @Value("${ai.gemini.api-key:}") String apiKey,
            @Value("${ai.gemini.model:gemini-2.0-flash}") String model,
            @Value("${ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            @Value("${ai.gemini.timeout-ms:15000}") long timeoutMs
    ) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.model = model;
        this.timeout = Duration.ofMillis(timeoutMs);
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
            log.warn(
                    "Gemini call rejected type={} inputChars={} estimatedInputTokens={} reason=not_configured",
                    resolvedCallType,
                    inputCharacters,
                    estimatedInputTokens
            );
            throw new AiProviderException("AI provider is not configured.");
        }

        long startedAt = System.nanoTime();
        try {
            JsonNode response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/models/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(model))
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(buildRequestBody(systemPrompt, userPrompt, jsonResponse, maxOutputTokens))
                    .retrieve()
                    .onStatus(
                            status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.releaseBody()
                                    .thenReturn(new AiProviderException(PROVIDER_ERROR_MESSAGE))
                    )
                    .bodyToMono(JsonNode.class)
                    .timeout(timeout)
                    .block();

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
        } catch (AiProviderException exception) {
            log.warn(
                    "Gemini call failed type={} inputChars={} estimatedInputTokens={} maxOutputTokens={} durationMs={} errorType={}",
                    resolvedCallType,
                    inputCharacters,
                    estimatedInputTokens,
                    maxOutputTokens,
                    elapsedMillis(startedAt),
                    exception.getClass().getSimpleName()
            );
            throw exception;
        } catch (Exception exception) {
            log.warn(
                    "Gemini call failed type={} inputChars={} estimatedInputTokens={} maxOutputTokens={} durationMs={} errorType={}",
                    resolvedCallType,
                    inputCharacters,
                    estimatedInputTokens,
                    maxOutputTokens,
                    elapsedMillis(startedAt),
                    exception.getClass().getSimpleName()
            );
            throw new AiProviderException(PROVIDER_ERROR_MESSAGE, exception);
        }
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
        JsonNode textNode = response == null
                ? null
                : response.path("candidates").path(0).path("content").path("parts").path(0).path("text");

        if (textNode == null || textNode.isMissingNode() || !textNode.isTextual()) {
            throw new AiProviderException("AI provider returned an invalid response.");
        }

        return textNode.asText();
    }
}
