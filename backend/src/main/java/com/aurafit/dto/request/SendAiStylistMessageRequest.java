package com.aurafit.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SendAiStylistMessageRequest(
        @NotNull(message = "sessionId is required")
        Long sessionId,

        String guestSessionId,

        Long selectedCostumeId,

        LocalDate rentalStartDate,

        LocalDate rentalEndDate,

        @NotBlank(message = "message is required")
        String message
) {
}
