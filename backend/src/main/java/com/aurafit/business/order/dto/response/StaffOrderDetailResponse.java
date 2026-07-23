package com.aurafit.business.order.dto.response;

import com.aurafit.business.order.enums.DeliveryMethod;
import com.aurafit.business.order.entity.RentalOrder;
import com.aurafit.business.order.entity.HandoverRecord;
import com.aurafit.business.order.enums.OrderStatus;
import com.aurafit.business.order.enums.ReturnStatus;
import com.aurafit.business.payment.enums.PaymentStatus;
import com.aurafit.business.payment.enums.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record StaffOrderDetailResponse(
        Long id,
        String customerName,
        String customerEmail,
        String customerPhone,
        CustomerInfo customer,
        String receiverName,
        String receiverPhone,
        String deliveryAddress,
        OrderStatus status,
        BigDecimal totalRentalFee,
        BigDecimal discountAmount,
        BigDecimal totalDeposit,
        BigDecimal shippingFee,
        BigDecimal finalAmount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<StaffOrderItemResponse> details,
        List<HandoverRecordDTO> handovers,
        String ghnOrderCode,
        String ghnReturnOrderCode,
        DeliveryMethod deliveryMethod,
        BigDecimal totalLateFee,
        BigDecimal totalDamageFee,
        BigDecimal totalRefundedAmount,
        String inspectionNote,
        Boolean hasPendingRefund,
        LocalDate rentalStartDate,
        LocalDate rentalEndDate
) {
    public record CustomerInfo(
            String bankName,
            String bankAccountNumber,
            String bankAccountName
    ) {}

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
            BigDecimal subtotal,
            BigDecimal rentalFee,
            BigDecimal discountAmount,
            BigDecimal discountPercent,
            Long discountEventId,
            String discountEventName,
            BigDecimal deposit,
            int rentalDays,
            BigDecimal lateFee,
            BigDecimal damageFee,
            BigDecimal refundedAmount,
            LocalDate rentalStartDate,
            LocalDate rentalEndDate,
            BigDecimal dailyPrice
    ) {}

    public static StaffOrderDetailResponse fromEntity(RentalOrder order, List<HandoverRecord> handovers) {
        List<StaffOrderItemResponse> items = order.getDetails().stream()
                .map(d -> {
                    OrderDetailPricing.Values pricing = OrderDetailPricing.from(d);
                    return new StaffOrderItemResponse(
                            d.getId(),
                            d.getCostumeItem().getCostume().getName(),
                            d.getCostumeItem().getSku(),
                            d.getCostumeItem().getSize(),
                            d.getCostumeItem().getColor(),
                            d.getCostumeItem().getCostume().getPrimaryImageUrl(),
                            d.getCostumeItem().getCostume().getAllImageUrls(),
                            ReturnStatus.NOT_RETURNED,
                            d.getReturnStatus(),
                            pricing.originalRentalFee(),
                            pricing.rentalFee(),
                            pricing.discountAmount(),
                            pricing.discountPercent(),
                            d.getDiscountEventId(),
                            d.getDiscountEventName(),
                            d.getDeposit(),
                            d.getRentalDays(),
                            d.getLateFee(),
                            d.getDamageFee(),
                            d.getRefundedAmount(),
                            d.getRentalStartDate(),
                            d.getRentalEndDate(),
                            d.getPricePerDay()
                    );
                })
                .toList();

        List<HandoverRecordDTO> handoverDTOs = handovers.stream()
                .map(HandoverRecordDTO::fromEntity)
                .toList();

        BigDecimal finalAmount = order.getTotalRentalPrice()
                .add(order.getTotalDeposit())
                .add(order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO)
                .subtract(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO);

        boolean hasPendingRefund = order.getPayments().stream()
                .anyMatch(p -> p.getType() == PaymentType.REFUND
                        && p.getStatus() == PaymentStatus.PENDING);

        return new StaffOrderDetailResponse(
                order.getId(),
                order.getUser().getFullName(),
                order.getUser().getEmail(),
                order.getUser().getPhone(),
                new CustomerInfo(
                        order.getUser().getBankName(),
                        order.getUser().getBankAccountNumber(),
                        order.getUser().getBankAccountName()
                ),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getDeliveryAddress(),
                order.getStatus(),
                order.getTotalRentalPrice(),
                order.getDiscountAmount(),
                order.getTotalDeposit(),
                order.getShippingFee(),
                finalAmount,
                order.getCreatedAt(),
                order.getUpdatedAt(),
                items,
                handoverDTOs,
                order.getGhnOrderCode(),
                order.getGhnReturnOrderCode(),
                order.getDeliveryMethod(),
                order.getTotalLateFee(),
                order.getTotalDamageFee(),
                order.getTotalRefundedAmount(),
                order.getInspectionNote(),
                hasPendingRefund,
                order.getRentalStartDate(),
                order.getRentalEndDate()
        );
    }
}
