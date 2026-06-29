package com.aurafit.dto.response;

import com.aurafit.enums.PaymentStatus;

import java.math.BigDecimal;

public record PaymentStatusResponse(
        PaymentStatus status,
        String paymentContent,
        BigDecimal amount,
        String transactionId
) {}
