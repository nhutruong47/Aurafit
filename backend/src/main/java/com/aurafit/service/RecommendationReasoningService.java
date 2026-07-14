package com.aurafit.service;

import com.aurafit.dto.ai.RecommendationReasoningInput;
import com.aurafit.dto.ai.RecommendationReasoningOutput;

public interface RecommendationReasoningService {

    default RecommendationReasoningOutput reason(RecommendationReasoningInput input) {
        return reason(input, RecommendationReasoningMode.AI_STYLIST_CHAT, null);
    }

    default RecommendationReasoningOutput reason(RecommendationReasoningInput input,
                                                 RecommendationReasoningMode mode) {
        return reason(input, mode, null);
    }

    RecommendationReasoningOutput reason(RecommendationReasoningInput input,
                                         RecommendationReasoningMode mode,
                                         String actorKey);

    enum RecommendationReasoningMode {
        AI_STYLIST_CHAT,
        SIMILAR_PRODUCTS,
        HOMEPAGE_PERSONALIZED
    }
}
