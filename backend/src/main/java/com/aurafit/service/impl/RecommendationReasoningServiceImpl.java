package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.dto.ai.RecommendationReasoningInput;
import com.aurafit.dto.ai.RecommendationReasoningOutput;
import com.aurafit.exception.AiReasoningParseException;
import com.aurafit.service.AiProviderClient;
import com.aurafit.service.RecommendationReasoningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationReasoningServiceImpl implements RecommendationReasoningService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationReasoningServiceImpl.class);

    private final AiProviderProperties properties;
    private final AiProviderClient aiProviderClient;
    private final ObjectMapper objectMapper;

    public RecommendationReasoningServiceImpl(AiProviderProperties properties,
                                              AiProviderClient aiProviderClient,
                                              ObjectMapper objectMapper) {
        this.properties = properties;
        this.aiProviderClient = aiProviderClient;
        this.objectMapper = objectMapper;

        if (!properties.isEnabled() && properties.isReasoningRankingEnabled()) {
            logger.warn("AI reasoning ranking is enabled but AI_ENABLED is false. Recommendation reasoning will stay disabled.");
        }
    }

    @Override
    public RecommendationReasoningOutput reason(RecommendationReasoningInput input) {
        if (input == null || input.userMessage() == null || input.userMessage().isBlank()) {
            throw new IllegalArgumentException("userMessage is required for recommendation reasoning.");
        }
        if (input.candidatePool() == null) {
            throw new IllegalArgumentException("candidatePool is required for recommendation reasoning.");
        }

        String rawJson = aiProviderClient.reasonRecommendations(
                new AiProviderClient.RecommendationReasoningPrompt(input)
        );
        return parseOutput(rawJson);
    }

    private RecommendationReasoningOutput parseOutput(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            if (root == null || !root.isObject()) {
                throw new AiReasoningParseException("Recommendation reasoning output must be a JSON object.");
            }

            JsonNode recommendationsNode = root.get("recommendations");
            if (recommendationsNode == null || !recommendationsNode.isArray()) {
                throw new AiReasoningParseException("Recommendation reasoning output must contain a recommendations array.");
            }

            List<RecommendationReasoningOutput.RecommendationItem> recommendations = new ArrayList<>();
            for (JsonNode itemNode : recommendationsNode) {
                if (itemNode == null || !itemNode.isObject()) {
                    throw new AiReasoningParseException("Each recommendation must be a JSON object.");
                }

                String costumeId = requireText(itemNode.get("costumeId"), "recommendations[].costumeId");
                String reasoning = requireText(itemNode.get("reasoning"), "recommendations[].reasoning");

                JsonNode confidenceNode = itemNode.get("confidenceScore");
                if (confidenceNode == null || !confidenceNode.isNumber()) {
                    throw new AiReasoningParseException("recommendations[].confidenceScore must be a number.");
                }
                double confidenceScore = confidenceNode.asDouble();
                if (confidenceScore < 0.0 || confidenceScore > 1.0) {
                    throw new AiReasoningParseException("recommendations[].confidenceScore must be between 0.0 and 1.0.");
                }

                JsonNode matchedAttributesNode = itemNode.get("matchedAttributes");
                if (matchedAttributesNode == null || !matchedAttributesNode.isArray()) {
                    throw new AiReasoningParseException("recommendations[].matchedAttributes must be an array.");
                }

                List<String> matchedAttributes = new ArrayList<>();
                for (JsonNode matchedAttributeNode : matchedAttributesNode) {
                    String matchedAttribute = normalizeNullableText(matchedAttributeNode);
                    if (matchedAttribute != null) {
                        matchedAttributes.add(matchedAttribute);
                    }
                }

                recommendations.add(new RecommendationReasoningOutput.RecommendationItem(
                        costumeId,
                        reasoning,
                        confidenceScore,
                        List.copyOf(matchedAttributes)
                ));
            }

            String clarificationNeeded = normalizeNullableText(root.get("clarificationNeeded"));
            String noMatchReason = normalizeNullableText(root.get("noMatchReason"));

            if (clarificationNeeded != null && noMatchReason != null) {
                throw new AiReasoningParseException("clarificationNeeded and noMatchReason cannot both be non-null.");
            }
            if (clarificationNeeded != null && !recommendations.isEmpty()) {
                throw new AiReasoningParseException("clarificationNeeded response must not include recommendations.");
            }
            if (noMatchReason != null && !recommendations.isEmpty()) {
                throw new AiReasoningParseException("noMatchReason response must not include recommendations.");
            }
            if (clarificationNeeded == null && noMatchReason == null && recommendations.isEmpty()) {
                throw new AiReasoningParseException("Recommendation reasoning output must include recommendations, clarificationNeeded, or noMatchReason.");
            }

            return new RecommendationReasoningOutput(
                    List.copyOf(recommendations),
                    clarificationNeeded,
                    noMatchReason
            );
        } catch (AiReasoningParseException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AiReasoningParseException("Cannot parse recommendation reasoning output.", exception);
        }
    }

    private String requireText(JsonNode node, String fieldName) {
        String value = normalizeNullableText(node);
        if (value == null) {
            throw new AiReasoningParseException(fieldName + " is required.");
        }
        return value;
    }

    private String normalizeNullableText(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }

        String value = node.asText(null);
        if (value == null) {
            return null;
        }

        String trimmed = value.trim().replaceAll("\\s+", " ");
        return trimmed.isEmpty() ? null : trimmed;
    }
}
