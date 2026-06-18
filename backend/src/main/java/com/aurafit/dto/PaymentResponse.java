package com.aurafit.dto;

import com.aurafit.entity.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long rentalOrderId,
        BigDecimal amount,
        String paymentType,
        String paymentMethod,
        String transactionId,
        String status,
        LocalDateTime paidAt,
        String orderStatus
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getRentalOrder().getId(),
                payment.getAmount(),
                payment.getPaymentType().name(),
                payment.getPaymentMethod(),
                payment.getTransactionId(),
                payment.getStatus(),
                payment.getPaidAt(),
                payment.getRentalOrder().getStatus()
        );
    }
}
