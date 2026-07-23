package com.aurafit.business.recommendation.service;

import com.aurafit.business.catalog.dto.response.CatalogCostumeDTO;

import java.util.List;

public interface BehaviorBasedRecommendationService {

    List<CatalogCostumeDTO> getRecommendationsForUser(Long userId, String sessionId, int limit);
}
