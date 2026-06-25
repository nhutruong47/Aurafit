package com.aurafit.service;

import com.aurafit.config.AiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiProviderClient {

    private static final Logger log = LoggerFactory.getLogger(AiProviderClient.class);

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public AiProviderClient(AiProperties aiProperties, ObjectMapper objectMapper) {
        this.aiProperties = aiProperties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(aiProperties.getProviderBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public EmbeddingResult generateEmbedding(String text) {
        if (text == null || text.isBlank()) {
            return new EmbeddingResult("fallback-empty", buildFallbackEmbedding("empty"));
        }

        if (!isExternalAiConfigured()) {
            return new EmbeddingResult("fallback-local-hash-v1", buildFallbackEmbedding(text));
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", aiProperties.getEmbeddingModel());
            body.put("input", text);

            String raw = restClient.post()
                    .uri("/embeddings")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + aiProperties.getApiKey())
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(raw);
            JsonNode dataNode = root.path("data");
            if (!dataNode.isArray() || dataNode.isEmpty()) {
                throw new IllegalStateException("Embedding response does not contain data.");
            }

            JsonNode vectorNode = dataNode.get(0).path("embedding");
            List<Double> embedding = new ArrayList<>();
            for (JsonNode valueNode : vectorNode) {
                embedding.add(valueNode.asDouble());
            }
            if (embedding.isEmpty()) {
                throw new IllegalStateException("Embedding vector is empty.");
            }

            return new EmbeddingResult(aiProperties.getEmbeddingModel(), embedding);
        } catch (Exception ex) {
            log.warn("Embedding provider failed. Falling back to local embedding. cause={}", ex.getMessage());
            return new EmbeddingResult("fallback-local-hash-v1", buildFallbackEmbedding(text));
        }
    }

    public String generateRecommendationReasons(String systemPrompt, String userPrompt) {
        if (!isExternalAiConfigured() || !aiProperties.isLlmExplanationEnabled()) {
            return null;
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", aiProperties.getChatModel());
            body.put("temperature", 0.2);
            body.put("response_format", Map.of("type", "json_object"));
            body.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
            ));

            String raw = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + aiProperties.getApiKey())
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(raw);
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            return contentNode.isTextual() ? contentNode.asText() : null;
        } catch (Exception ex) {
            log.warn("Chat completion provider failed. Falling back to deterministic reasons. cause={}", ex.getMessage());
            return null;
        }
    }

    private boolean isExternalAiConfigured() {
        return aiProperties.isEnabled()
                && aiProperties.getApiKey() != null
                && !aiProperties.getApiKey().isBlank();
    }

    private List<Double> buildFallbackEmbedding(String text) {
        int dimension = Math.max(16, aiProperties.getFallbackEmbeddingDimension());
        double[] vector = new double[dimension];
        String normalized = text.toLowerCase().replaceAll("[^\\p{L}\\p{Nd}]+", " ").trim();
        if (normalized.isBlank()) {
            return toList(vector);
        }

        for (String token : normalized.split("\\s+")) {
            if (token.isBlank()) {
                continue;
            }

            byte[] digest = sha256(token);
            for (int i = 0; i < digest.length; i++) {
                int bucket = i % dimension;
                vector[bucket] += ((digest[i] & 0xff) / 255.0) - 0.5;
            }
        }

        double norm = 0d;
        for (double value : vector) {
            norm += value * value;
        }
        norm = Math.sqrt(norm);
        if (norm == 0d) {
            return toList(vector);
        }
        for (int i = 0; i < vector.length; i++) {
            vector[i] = vector[i] / norm;
        }
        return toList(vector);
    }

    private byte[] sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            return Base64.getEncoder().encode(value.getBytes(StandardCharsets.UTF_8));
        }
    }

    private List<Double> toList(double[] source) {
        List<Double> values = new ArrayList<>(source.length);
        for (double value : source) {
            values.add(value);
        }
        return values;
    }

    public record EmbeddingResult(String model, List<Double> embedding) {}
}
