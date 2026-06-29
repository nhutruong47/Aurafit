package com.aurafit.dto.request;

import com.aurafit.enums.ReturnStatus;
import jakarta.validation.constraints.NotNull;

public record ItemAssessmentDTO(
        @NotNull(message = "rentalOrderDetailId is required")
        Long rentalOrderDetailId,
        @NotNull(message = "returnStatus is required")
        ReturnStatus returnStatus,
        String note
) {}
