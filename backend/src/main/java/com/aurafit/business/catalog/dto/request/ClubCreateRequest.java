package com.aurafit.business.catalog.dto.request;

import com.aurafit.business.catalog.enums.ClubStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ClubCreateRequest(
        @NotBlank(message = "Club name is required")
        @Size(max = 100, message = "Club name cannot exceed 100 characters")
        String name,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        @NotNull(message = "Membership fee is required")
        @DecimalMin(value = "0.0", message = "Membership fee must be greater than or equal to 0")
        BigDecimal membershipFee,

        @NotNull(message = "Discount rate is required")
        @DecimalMin(value = "0.0", message = "Discount rate must be between 0.0 and 1.0")
        @DecimalMax(value = "1.0", message = "Discount rate must be between 0.0 and 1.0")
        Double discountRate,

        @NotNull(message = "Status is required")
        ClubStatus status
) {}
