package com.aurafit.business.payment.dto.request;

import jakarta.validation.constraints.NotNull;

public record PaymentCreateRequest(
        @NotNull(message = "orderId is required")
        Integer orderId
) {}
