package com.aurafit.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CheckoutRequest(
        @NotBlank(message = "receiverName is required")
        String receiverName,

        @NotBlank(message = "receiverPhone is required")
        String receiverPhone,

        @NotBlank(message = "deliveryAddress is required")
        String deliveryAddress
) {}
