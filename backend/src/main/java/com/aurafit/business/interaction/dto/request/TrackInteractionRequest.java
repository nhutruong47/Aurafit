package com.aurafit.business.interaction.dto.request;

import com.aurafit.business.interaction.enums.InteractionEventType;
import com.aurafit.business.interaction.enums.InteractionTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TrackInteractionRequest(
        @NotBlank(message = "sessionId is required")
        String sessionId,

        @NotNull(message = "eventType is required")
        InteractionEventType eventType,

        InteractionTargetType targetType,
        String targetId,
        String queryText,
        String pagePath,
        String metadataJson
) {}
