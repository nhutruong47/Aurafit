package com.aurafit.dto.response;

import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import com.aurafit.enums.DeliveryMethod;
import com.aurafit.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        Long userId,
        String receiverName,
        String receiverPhone,
        String deliveryAddress,
        DeliveryMethod deliveryMethod,
        BigDecimal shippingFee,
        BigDecimal totalRentalPrice,
        BigDecimal totalDeposit,
        BigDecimal discountAmount,
        BigDecimal finalAmount,
        OrderStatus status,
        LocalDateTime rentalStartDate,
        LocalDateTime rentalEndDate,
        LocalDateTime createdAt,
        List<OrderDetailResponse> details,
        String ghnOrderCode,
        String ghnReturnOrderCode,
        BigDecimal totalLateFee,
        BigDecimal totalDamageFee,
        BigDecimal totalRefundedAmount
) {
    public record OrderDetailResponse(
            Long id,
            Long costumeItemId,
            String sku,
            String costumeName,
            String size,
            String color,
            BigDecimal pricePerDay,
            int rentalDays,
            BigDecimal subtotal,
            String returnStatus
    ) {}

    public static OrderResponse fromEntity(RentalOrder order) {
        List<OrderDetailResponse> details = order.getDetails().stream()
                .map(d -> new OrderDetailResponse(
                        d.getId(),
                        d.getCostumeItem().getId(),
                        d.getCostumeItem().getSku(),
                        d.getCostumeItem().getCostume().getName(),
                        d.getCostumeItem().getSize(),
                        d.getCostumeItem().getColor(),
                        d.getPricePerDay(),
                        d.getRentalDays(),
                        d.getSubtotal(),
                        d.getReturnStatus().name()
                ))
                .toList();

        BigDecimal finalAmount = order.getTotalRentalPrice()
                .add(order.getTotalDeposit())
                .add(order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO)
                .subtract(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO);

        return new OrderResponse(
                order.getId(),
                order.getUser().getId(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getDeliveryAddress(),
                order.getDeliveryMethod(),
                order.getShippingFee(),
                order.getTotalRentalPrice(),
                order.getTotalDeposit(),
                order.getDiscountAmount(),
                finalAmount,
                order.getStatus(),
                order.getRentalStartDate(),
                order.getRentalEndDate(),
                order.getCreatedAt(),
                details,
                order.getGhnOrderCode(),
                order.getGhnReturnOrderCode(),
                order.getTotalLateFee(),
                order.getTotalDamageFee(),
                order.getTotalRefundedAmount()
        );
    }
}
