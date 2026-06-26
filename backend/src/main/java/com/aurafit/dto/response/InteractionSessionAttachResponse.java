package com.aurafit.dto.response;

public record InteractionSessionAttachResponse(
        String sessionId,
        int mergedEventCount
) {}
