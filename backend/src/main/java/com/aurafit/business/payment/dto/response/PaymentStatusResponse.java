package com.aurafit.business.payment.dto.response;

import com.aurafit.business.payment.enums.PaymentStatus;

import java.math.BigDecimal;

public record PaymentStatusResponse(
        PaymentStatus status,
        String paymentContent,
        BigDecimal amount,
        String transactionId
) {}
