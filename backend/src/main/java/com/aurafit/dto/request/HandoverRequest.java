package com.aurafit.dto.request;

import com.aurafit.enums.ReturnStatus;
import jakarta.validation.constraints.NotNull;

public record HandoverRequest(
        Long rentalOrderDetailId,
        ReturnStatus returnStatus,
        String imageUrl,
        String note
) {}
