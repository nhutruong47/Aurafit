package com.aurafit.dto.response;

import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import com.aurafit.enums.DeliveryMethod;
import com.aurafit.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
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
        LocalDateTime createdAt,
        List<OrderDetailResponse> details,
        String ghnOrderCode,
        String ghnReturnOrderCode,
        BigDecimal totalLateFee,
        BigDecimal totalDamageFee,
        BigDecimal totalRefundedAmount,
        Integer consecutiveCancelCount,
        Boolean hasPendingRefund,
        LocalDateTime updatedAt,
        LocalDate rentalStartDate,
        LocalDate rentalEndDate
) {
    public record OrderDetailResponse(
            Long id,
            Long costumeItemId,
            Long costumeId,
            String sku,
            String costumeName,
            String size,
            String color,
            String imageUrl,
            List<String> imageUrls,
            BigDecimal pricePerDay,
            int rentalDays,
            BigDecimal subtotal,
            BigDecimal deposit,
            String returnStatus,
            LocalDate rentalStartDate,
            LocalDate rentalEndDate
    ) {}

    public static OrderResponse fromEntity(RentalOrder order) {
        List<OrderDetailResponse> details = order.getDetails().stream()
                .map(d -> new OrderDetailResponse(
                        d.getId(),
                        d.getCostumeItem().getId(),
                        d.getCostumeItem().getCostume().getId(),
                        d.getCostumeItem().getSku(),
                        d.getCostumeItem().getCostume().getName(),
                        d.getCostumeItem().getSize(),
                        d.getCostumeItem().getColor(),
                        d.getCostumeItem().getCostume().getPrimaryImageUrl(),
                        d.getCostumeItem().getCostume().getAllImageUrls(),
                        d.getPricePerDay(),
                        d.getRentalDays(),
                        d.getSubtotal(),
                        d.getDeposit(),
                        d.getReturnStatus().name(),
                        d.getRentalStartDate(),
                        d.getRentalEndDate()
                ))
                .toList();

        BigDecimal finalAmount = order.getTotalRentalPrice()
                .add(order.getTotalDeposit())
                .add(order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO)
                .subtract(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO);

        boolean hasPendingRefund = order.getPayments().stream()
                .anyMatch(p -> "REFUND".equals(p.getType().name()) && "PENDING".equals(p.getStatus().name()));

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
                order.getCreatedAt(),
                details,
                order.getGhnOrderCode(),
                order.getGhnReturnOrderCode(),
                order.getTotalLateFee(),
                order.getTotalDamageFee(),
                order.getTotalRefundedAmount(),
                order.getUser().getConsecutiveCancelCount(),
                hasPendingRefund,
                order.getUpdatedAt(),
                order.getRentalStartDate(),
                order.getRentalEndDate()
        );
    }
}
