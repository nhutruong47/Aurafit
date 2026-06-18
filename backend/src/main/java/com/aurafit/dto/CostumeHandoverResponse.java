package com.aurafit.dto;

import com.aurafit.entity.CostumeHandover;

import java.time.LocalDateTime;

public record CostumeHandoverResponse(
        Long id,
        Long rentalOrderId,
        Long rentalOrderDetailId,
        Long costumeItemId,
        String costumeName,
        String skuCode,
        Long staffUserId,
        String staffName,
        String type,
        String returnStatus,
        String handoverImageUrl,
        String note,
        LocalDateTime createdAt
) {
    public static CostumeHandoverResponse from(CostumeHandover handover) {
        return new CostumeHandoverResponse(
                handover.getId(),
                handover.getRentalOrder().getId(),
                handover.getRentalOrderDetail().getId(),
                handover.getCostumeItem().getId(),
                handover.getCostumeItem().getCostume().getName(),
                handover.getCostumeItem().getSkuCode(),
                handover.getStaff().getId(),
                handover.getStaff().getFullName(),
                handover.getType(),
                handover.getReturnStatus(),
                handover.getHandoverImageUrl(),
                handover.getNote(),
                handover.getCreatedAt()
        );
    }
}
