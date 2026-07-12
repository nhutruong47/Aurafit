package com.aurafit.service;

import com.aurafit.dto.ai.RecommendationReasoningInput;
import com.aurafit.dto.ai.RecommendationReasoningOutput;

public interface RecommendationReasoningService {

    RecommendationReasoningOutput reason(RecommendationReasoningInput input);
}
