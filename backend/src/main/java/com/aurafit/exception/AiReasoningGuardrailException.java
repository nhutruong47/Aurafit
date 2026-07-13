package com.aurafit.exception;

import com.aurafit.service.impl.RecommendationReasoningGuardrailService;

public class AiReasoningGuardrailException extends RuntimeException {

    private final RecommendationReasoningGuardrailService.FallbackReason fallbackReason;

    public AiReasoningGuardrailException(RecommendationReasoningGuardrailService.FallbackReason fallbackReason,
                                         String message) {
        super(message);
        this.fallbackReason = fallbackReason;
    }

    public RecommendationReasoningGuardrailService.FallbackReason getFallbackReason() {
        return fallbackReason;
    }
}
