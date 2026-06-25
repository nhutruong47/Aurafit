package com.aurafit.service;

import com.aurafit.dto.request.OutfitComboRequest;
import com.aurafit.dto.request.RecommendationQueryRequest;
import com.aurafit.dto.response.OutfitComboResponse;
import com.aurafit.dto.response.RecommendationResponse;

public interface AiRecommendationService {

    RecommendationResponse getRecommendationsForQuery(Long authenticatedUserId, RecommendationQueryRequest request);

    RecommendationResponse getPersonalizedRecommendations(Long userId, Integer limit);

    RecommendationResponse getRecommendationPreview(Long userId, Integer limit);

    OutfitComboResponse getOutfitCombos(Long authenticatedUserId, OutfitComboRequest request);
}
