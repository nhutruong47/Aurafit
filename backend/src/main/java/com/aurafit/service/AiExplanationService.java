package com.aurafit.service;

import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;

import java.util.List;

public interface AiExplanationService {

    List<SimilarCostumeRecommendationDTO> enhanceRecommendationReasons(
            String surface,
            String contextSummary,
            List<SimilarCostumeRecommendationDTO> recommendations
    );
}
