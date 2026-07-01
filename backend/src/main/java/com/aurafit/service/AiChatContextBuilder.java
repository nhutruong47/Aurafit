package com.aurafit.service;

import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;
import com.aurafit.entity.AiStylistSession;
import com.aurafit.entity.Costume;

import java.util.List;
import java.util.Map;

public interface AiChatContextBuilder {

    AiChatContext build(AiStylistSession session, String latestUserMessage, Map<Long, Costume> activeCostumesById);

    List<SimilarCostumeRecommendationDTO> readStoredRecommendations(String metadataJson, Map<Long, Costume> activeCostumesById);
}
