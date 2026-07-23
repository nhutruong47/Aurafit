package com.aurafit.business.catalog.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record EventCostumeAssignRequest(
        @NotNull(message = "Costume ID là bắt buộc")
        Long costumeId,

        @DecimalMin(value = "0", inclusive = false, message = "Phần trăm giảm riêng phải lớn hơn 0")
        @DecimalMax(value = "100", message = "Phần trăm giảm riêng không được vượt quá 100")
        @Digits(integer = 3, fraction = 2, message = "Phần trăm giảm riêng chỉ được có tối đa 2 chữ số thập phân")
        BigDecimal discountPercentOverride
) {
}
