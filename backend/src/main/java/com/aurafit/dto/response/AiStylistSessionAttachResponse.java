package com.aurafit.dto.response;

public record AiStylistSessionAttachResponse(
        String guestSessionId,
        int attachedSessionCount,
        Long preferredSessionId
) {
}
