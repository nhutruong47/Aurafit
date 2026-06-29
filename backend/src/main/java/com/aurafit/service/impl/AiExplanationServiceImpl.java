package com.aurafit.service.impl;

import com.aurafit.config.AiProviderProperties;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.CostumeMetadataDTO;
import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;
import com.aurafit.service.AiExplanationService;
import com.aurafit.service.AiProviderClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiExplanationServiceImpl implements AiExplanationService {

    private static final Logger logger = LoggerFactory.getLogger(AiExplanationServiceImpl.class);

    private final AiProviderProperties properties;
    private final AiProviderClient aiProviderClient;

    public AiExplanationServiceImpl(AiProviderProperties properties, AiProviderClient aiProviderClient) {
        this.properties = properties;
        this.aiProviderClient = aiProviderClient;
    }

    @Override
    public List<SimilarCostumeRecommendationDTO> enhanceRecommendationReasons(
            String surface,
            String contextSummary,
            List<SimilarCostumeRecommendationDTO> recommendations
    ) {
        if (recommendations == null || recommendations.isEmpty() || !properties.isExplanationAvailable()) {
            return recommendations;
        }

        try {
            List<String> generatedReasons = aiProviderClient.generateRecommendationExplanations(
                    new AiProviderClient.RecommendationExplanationPrompt(
                            surface,
                            contextSummary,
                            recommendations.stream()
                                    .map(this::toPromptItem)
                                    .toList()
                    )
            );

            if (generatedReasons == null || generatedReasons.isEmpty()) {
                return recommendations;
            }

            return mapReasons(recommendations, generatedReasons);
        } catch (Exception exception) {
            logger.warn("Falling back to rule-based recommendation reasons for surface {} because AI explanation failed: {}",
                    surface, summarize(exception));
            return recommendations;
        }
    }

    private List<SimilarCostumeRecommendationDTO> mapReasons(
            List<SimilarCostumeRecommendationDTO> recommendations,
            List<String> generatedReasons
    ) {
        return java.util.stream.IntStream.range(0, recommendations.size())
                .mapToObj(index -> {
                    SimilarCostumeRecommendationDTO recommendation = recommendations.get(index);
                    String generatedReason = index < generatedReasons.size() ? normalize(generatedReasons.get(index)) : null;
                    return new SimilarCostumeRecommendationDTO(
                            recommendation.costume(),
                            generatedReason != null ? generatedReason : recommendation.reason(),
                            recommendation.score(),
                            recommendation.availableItemCount()
                    );
                })
                .toList();
    }

    private AiProviderClient.RecommendationExplanationItem toPromptItem(SimilarCostumeRecommendationDTO recommendation) {
        CostumeDTO costume = recommendation.costume();
        CostumeMetadataDTO metadata = costume != null ? costume.metadata() : null;
        return new AiProviderClient.RecommendationExplanationItem(
                costume != null ? costume.id() : null,
                costume != null ? costume.name() : null,
                costume != null && costume.category() != null ? costume.category().name() : null,
                costume != null ? costume.description() : null,
                metadata != null ? metadata.style() : null,
                metadata != null ? metadata.occasion() : null,
                metadata != null ? metadata.season() : null,
                metadata != null ? metadata.color() : null,
                metadata != null ? metadata.tags() : List.of(),
                recommendation.reason(),
                recommendation.availableItemCount()
        );
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String summarize(Exception exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? exception.getClass().getSimpleName() : message;
    }
}
