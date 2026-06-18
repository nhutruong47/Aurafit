package com.aurafit.dto;

import com.aurafit.entity.RentalOrder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record StaffRentalOrderResponse(
        Long id,
        String customerName,
        String customerEmail,
        String customerPhone,
        LocalDateTime rentalDate,
        LocalDateTime returnDate,
        String status,
        BigDecimal totalDeposit,
        BigDecimal totalRentalFee,
        String notes,
        List<RentalOrderDetailResponse> details,
        List<CostumeHandoverResponse> handovers
) {
    public static StaffRentalOrderResponse from(
            RentalOrder rentalOrder,
            List<RentalOrderDetailResponse> details,
            List<CostumeHandoverResponse> handovers
    ) {
        return new StaffRentalOrderResponse(
                rentalOrder.getId(),
                rentalOrder.getUser().getFullName(),
                rentalOrder.getUser().getEmail(),
                rentalOrder.getUser().getPhone(),
                rentalOrder.getRentalDate(),
                rentalOrder.getReturnDate(),
                rentalOrder.getStatus(),
                rentalOrder.getTotalDeposit(),
                rentalOrder.getTotalRentalFee(),
                rentalOrder.getNotes(),
                details,
                handovers
        );
    }
}
