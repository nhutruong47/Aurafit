package com.aurafit.business.order.dto.response;

import com.aurafit.business.order.entity.RentalOrder;
import com.aurafit.business.order.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import java.time.LocalDate;

public record OrderSummaryResponse(
        Long id,
        LocalDateTime createdAt,
        OrderStatus status,
        BigDecimal totalRentalPrice,
        BigDecimal totalDeposit,
        int itemCount,
        String imageUrl,
        LocalDate rentalStartDate,
        LocalDate rentalEndDate
) {
    public static OrderSummaryResponse fromEntity(RentalOrder order) {
        String imageUrl = order.getDetails().stream()
                .map(detail -> detail.getCostumeItem().getCostume().getPrimaryImageUrl())
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(null);

        return new OrderSummaryResponse(
                order.getId(),
                order.getCreatedAt(),
                order.getStatus(),
                order.getTotalRentalPrice(),
                order.getTotalDeposit(),
                order.getDetails().size(),
                imageUrl,
                order.getRentalStartDate(),
                order.getRentalEndDate()
        );
    }
}
