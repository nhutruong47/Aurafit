package com.aurafit.service.recommendation;

import com.aurafit.dto.response.CatalogCostumeDTO;

import java.util.List;

public interface BehaviorBasedRecommendationService {

    List<CatalogCostumeDTO> getRecommendationsForUser(Long userId, String sessionId, int limit);
}
