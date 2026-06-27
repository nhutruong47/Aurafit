package com.aurafit.dto.request;

public record CreateAiStylistSessionRequest(
        String guestSessionId,
        Long contextCostumeId
) {
}
