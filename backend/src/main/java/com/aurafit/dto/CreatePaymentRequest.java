package com.aurafit.dto;

import com.aurafit.entity.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreatePaymentRequest(
        @NotNull Long rentalOrderId,
        @NotNull @DecimalMin("1.0") BigDecimal amount,
        @NotNull PaymentType paymentType,
        @NotBlank String paymentMethod
) {
}
