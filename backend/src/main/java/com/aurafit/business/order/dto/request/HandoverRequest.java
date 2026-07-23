package com.aurafit.business.order.dto.request;

import com.aurafit.business.order.enums.ReturnStatus;

public record HandoverRequest(
        Long rentalOrderDetailId,
        ReturnStatus returnStatus,
        String imageUrl,
        String note
) {}
