package com.aurafit.ai.analytics.dto.response;

import com.aurafit.business.payment.entity.Payment;
import com.aurafit.business.order.enums.OrderStatus;
import com.aurafit.business.payment.enums.PaymentMethod;
import com.aurafit.business.payment.enums.PaymentStatus;
import com.aurafit.business.payment.enums.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RevenueTransactionDTO(
        Long paymentId,
        Long orderId,
        String customerName,
        String customerEmail,
        String customerPhone,
        BigDecimal amount,
        PaymentMethod method,
        PaymentStatus status,
        PaymentType type,
        String transactionId,
        OrderStatus orderStatus,
        LocalDateTime paidAt
) {
    public static RevenueTransactionDTO fromEntity(Payment payment, BigDecimal revenueAmount) {
        var order = payment.getRentalOrder();
        var customer = order.getUser();

        return new RevenueTransactionDTO(
                payment.getId(),
                order.getId(),
                customer.getFullName(),
                customer.getEmail(),
                customer.getPhone(),
                revenueAmount,
                payment.getMethod(),
                payment.getStatus(),
                payment.getType(),
                payment.getTransactionId(),
                order.getStatus(),
                payment.getUpdatedAt()
        );
    }
}
