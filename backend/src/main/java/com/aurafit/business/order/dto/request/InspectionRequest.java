package com.aurafit.business.order.dto.request;

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
    private BigDecimal damageFee;
    private BigDecimal lateFee;
    private String inspectionNote;
    private LocalDate actualReturnDate;
}
