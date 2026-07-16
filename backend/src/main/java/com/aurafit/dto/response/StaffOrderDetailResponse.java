package com.aurafit.dto.response;

import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import com.aurafit.entity.HandoverRecord;
import com.aurafit.enums.OrderStatus;
import com.aurafit.enums.ReturnStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record StaffOrderDetailResponse(
        Long id,
        String customerName,
        String customerEmail,
        String customerPhone,
        String receiverName,
        String receiverPhone,
        String deliveryAddress,
        OrderStatus status,
        BigDecimal totalRentalFee,
        BigDecimal totalDeposit,
        BigDecimal finalAmount,
        LocalDateTime rentalStartDate,
        LocalDateTime rentalEndDate,
        LocalDateTime createdAt,
        List<StaffOrderItemResponse> details,
        List<HandoverRecordDTO> handovers
) {
    public record StaffOrderItemResponse(
            Long id,
            String costumeName,
            String skuCode,
            String size,
            String color,
            String imageUrl,
            List<String> imageUrls,
            ReturnStatus itemStatus,
            ReturnStatus returnStatus,
            BigDecimal rentalPrice,
            BigDecimal depositPrice,
            int rentalDays,
            BigDecimal lateFee,
            BigDecimal damageFee,
            BigDecimal refundedAmount
    ) {}

    public static StaffOrderDetailResponse fromEntity(RentalOrder order, List<HandoverRecord> handovers) {
        List<StaffOrderItemResponse> items = order.getDetails().stream()
                .map(d -> new StaffOrderItemResponse(
                        d.getId(),
                        d.getCostumeItem().getCostume().getName(),
                        d.getCostumeItem().getSku(),
                        d.getCostumeItem().getSize(),
                        d.getCostumeItem().getColor(),
                        d.getCostumeItem().getCostume().getPrimaryImageUrl(),
                        d.getCostumeItem().getCostume().getAllImageUrls(),
                        ReturnStatus.NOT_RETURNED,
                        d.getReturnStatus(),
                        d.getPricePerDay(),
                        d.getDeposit(),
                        d.getRentalDays(),
                        d.getLateFee(),
                        d.getDamageFee(),
                        d.getRefundedAmount()
                ))
                .toList();

        List<HandoverRecordDTO> handoverDTOs = handovers.stream()
                .map(HandoverRecordDTO::fromEntity)
                .toList();

        BigDecimal finalAmount = order.getTotalRentalPrice()
                .subtract(order.getDiscountAmount());

        return new StaffOrderDetailResponse(
                order.getId(),
                order.getUser().getFullName(),
                order.getUser().getEmail(),
                order.getUser().getPhone(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getDeliveryAddress(),
                order.getStatus(),
                order.getTotalRentalPrice(),
                order.getTotalDeposit(),
                finalAmount,
                order.getRentalStartDate(),
                order.getRentalEndDate(),
                order.getCreatedAt(),
                items,
                handoverDTOs
        );
    }
}
