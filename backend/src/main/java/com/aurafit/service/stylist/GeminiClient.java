package com.aurafit.service.stylist;

import com.aurafit.exception.AiProviderException;
import com.fasterxml.jackson.databind.JsonNode;
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
public class GeminiClient {

    private static final String PROVIDER_ERROR_MESSAGE = "AI provider request failed.";

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
        return generate(systemPrompt, userPrompt, true);
    }

    public String generateText(String systemPrompt, String userPrompt) {
        return generate(systemPrompt, userPrompt, false);
    }

    private String generate(String systemPrompt, String userPrompt, boolean jsonResponse) {
        if (!StringUtils.hasText(apiKey)) {
            throw new AiProviderException("AI provider is not configured.");
        }

        try {
            JsonNode response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/models/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(model))
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(buildRequestBody(systemPrompt, userPrompt, jsonResponse))
                    .retrieve()
                    .onStatus(
                            status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.releaseBody()
                                    .thenReturn(new AiProviderException(PROVIDER_ERROR_MESSAGE))
                    )
                    .bodyToMono(JsonNode.class)
                    .timeout(timeout)
                    .block();

            return extractResponseText(response);
        } catch (AiProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AiProviderException(PROVIDER_ERROR_MESSAGE, exception);
        }
    }

    private Map<String, Object> buildRequestBody(String systemPrompt, String userPrompt, boolean jsonResponse) {
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

        if (jsonResponse) {
            requestBody.put("generationConfig", Map.of(
                    "responseMimeType", MediaType.APPLICATION_JSON_VALUE
            ));
        }

        return requestBody;
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
