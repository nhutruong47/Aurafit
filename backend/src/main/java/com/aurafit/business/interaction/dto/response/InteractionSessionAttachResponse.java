package com.aurafit.business.interaction.dto.response;

public record InteractionSessionAttachResponse(
        String sessionId,
        int mergedEventCount
) {}
