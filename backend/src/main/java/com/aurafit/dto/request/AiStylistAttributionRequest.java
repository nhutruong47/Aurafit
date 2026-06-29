package com.aurafit.dto.request;

public record AiStylistAttributionRequest(
        String interactionSessionId,
        Long aiStylistSessionId,
        Long aiStylistMessageId,
        String guestSessionId,
        Integer recommendationPosition,
        String recommendationReason
) {
}
