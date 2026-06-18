package com.aurafit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StaffHandoverRequest(
        @NotNull Long staffUserId,
        @NotNull Long rentalOrderDetailId,
        @NotBlank String handoverImageUrl,
        String note,
        String returnStatus
) {
}
