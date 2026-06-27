package com.aurafit.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AttachAiStylistSessionRequest(
        @NotBlank(message = "guestSessionId is required")
        String guestSessionId,

        Long preferredSessionId
) {
}
