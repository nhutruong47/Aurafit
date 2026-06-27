package com.aurafit.service;

import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;

import java.util.List;

public interface RecommendationService {

    List<SimilarCostumeRecommendationDTO> getSimilarCostumes(Long costumeId, int limit);

    List<SimilarCostumeRecommendationDTO> getHomepageRecommendations(String authenticatedEmail, String sessionId, int limit);
}
