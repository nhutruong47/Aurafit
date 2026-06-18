package com.aurafit.dto;

import com.aurafit.entity.RentalOrderDetail;

import java.math.BigDecimal;

public record RentalOrderDetailResponse(
        Long id,
        Long costumeItemId,
        Long costumeId,
        String costumeName,
        String costumeImageUrl,
        String skuCode,
        String size,
        String itemStatus,
        String returnStatus,
        BigDecimal rentalPrice,
        BigDecimal depositPrice
) {
    public static RentalOrderDetailResponse from(RentalOrderDetail detail) {
        return new RentalOrderDetailResponse(
                detail.getId(),
                detail.getCostumeItem().getId(),
                detail.getCostumeItem().getCostume().getId(),
                detail.getCostumeItem().getCostume().getName(),
                detail.getCostumeItem().getCostume().getImageUrl(),
                detail.getCostumeItem().getSkuCode(),
                detail.getCostumeItem().getSize(),
                detail.getCostumeItem().getStatus(),
                detail.getReturnStatus(),
                detail.getRentalPrice(),
                detail.getDepositPrice()
        );
    }
}
