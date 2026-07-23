package com.aurafit.interaction.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AttachInteractionSessionRequest(
        @NotBlank(message = "sessionId is required")
        String sessionId
) {}
