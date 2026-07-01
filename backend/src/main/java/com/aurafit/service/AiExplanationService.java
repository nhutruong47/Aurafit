package com.aurafit.service;

import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;

import java.util.List;

public interface AiExplanationService {

    List<SimilarCostumeRecommendationDTO> enhanceRecommendationReasons(
            String surface,
            String contextSummary,
            String replyLanguage,
            String userMessageExcerpt,
            String detectedIntentJson,
            List<SimilarCostumeRecommendationDTO> recommendations
    );

    default List<SimilarCostumeRecommendationDTO> enhanceRecommendationReasons(
            String surface,
            String contextSummary,
            String replyLanguage,
            String userMessageExcerpt,
            String detectedIntentJson,
            List<SimilarCostumeRecommendationDTO> recommendations,
            AiChatContext chatContext
    ) {
        return enhanceRecommendationReasons(
                surface,
                contextSummary,
                replyLanguage,
                userMessageExcerpt,
                detectedIntentJson,
                recommendations
        );
    }
}
