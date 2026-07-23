package com.aurafit.interaction.dto.response;

public record InteractionSessionAttachResponse(
        String sessionId,
        int mergedEventCount
) {}
