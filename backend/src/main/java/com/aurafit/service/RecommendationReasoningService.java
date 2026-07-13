package com.aurafit.service;

import com.aurafit.dto.ai.RecommendationReasoningInput;
import com.aurafit.dto.ai.RecommendationReasoningOutput;

public interface RecommendationReasoningService {

    default RecommendationReasoningOutput reason(RecommendationReasoningInput input) {
        return reason(input, RecommendationReasoningMode.AI_STYLIST_CHAT);
    }

    RecommendationReasoningOutput reason(RecommendationReasoningInput input, RecommendationReasoningMode mode);

    enum RecommendationReasoningMode {
        AI_STYLIST_CHAT,
        SIMILAR_PRODUCTS,
        HOMEPAGE_PERSONALIZED
    }
}
