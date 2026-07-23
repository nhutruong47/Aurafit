package com.aurafit.business.order.dto.request;

import com.aurafit.business.order.enums.ReturnStatus;
import jakarta.validation.constraints.NotNull;

public record ItemAssessmentDTO(
        @NotNull(message = "rentalOrderDetailId is required")
        Long rentalOrderDetailId,
        @NotNull(message = "returnStatus is required")
        ReturnStatus returnStatus,
        java.math.BigDecimal lateFee,
        java.math.BigDecimal damageFee,
        String note
) {}
