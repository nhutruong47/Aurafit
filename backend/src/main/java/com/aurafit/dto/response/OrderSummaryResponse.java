package com.aurafit.dto.response;

import com.aurafit.entity.RentalOrder;
import com.aurafit.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderSummaryResponse(
        Long id,
        LocalDateTime createdAt,
        OrderStatus status,
        BigDecimal totalRentalPrice,
        BigDecimal totalDeposit,
        int itemCount
) {
    public static OrderSummaryResponse fromEntity(RentalOrder order) {
        return new OrderSummaryResponse(
                order.getId(),
                order.getCreatedAt(),
                order.getStatus(),
                order.getTotalRentalPrice(),
                order.getTotalDeposit(),
                order.getDetails().size()
        );
    }
}
