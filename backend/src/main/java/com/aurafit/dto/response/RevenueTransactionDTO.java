package com.aurafit.dto.response;

import com.aurafit.entity.Payment;
import com.aurafit.enums.OrderStatus;
import com.aurafit.enums.PaymentMethod;
import com.aurafit.enums.PaymentStatus;
import com.aurafit.enums.PaymentType;

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
    public static RevenueTransactionDTO fromEntity(Payment payment) {
        var order = payment.getRentalOrder();
        var customer = order.getUser();

        return new RevenueTransactionDTO(
                payment.getId(),
                order.getId(),
                customer.getFullName(),
                customer.getEmail(),
                customer.getPhone(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getType(),
                payment.getTransactionId(),
                order.getStatus(),
                payment.getUpdatedAt()
        );
    }
}
