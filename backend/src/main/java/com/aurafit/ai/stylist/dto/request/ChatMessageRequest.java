package com.aurafit.ai.stylist.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ChatMessageRequest(
        String sessionId,

        @NotBlank(message = "message is required")
        String message
) {
}
