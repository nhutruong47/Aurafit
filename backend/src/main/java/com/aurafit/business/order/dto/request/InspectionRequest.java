package com.aurafit.business.order.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionRequest {
    @PositiveOrZero(message = "Damage fee must be zero or greater")
    private BigDecimal damageFee;

    @PositiveOrZero(message = "Late fee must be zero or greater")
    private BigDecimal lateFee;
    private String inspectionNote;
    private LocalDate actualReturnDate;
}
