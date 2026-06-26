package com.aurafit.dto.request;

import com.aurafit.enums.ClubStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ClubUpdateRequest(
        @Size(min = 1, max = 100, message = "Club name must be between 1 and 100 characters")
        String name,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        @DecimalMin(value = "0.0", message = "Membership fee must be greater than or equal to 0")
        BigDecimal membershipFee,

        @DecimalMin(value = "0.0", message = "Discount rate must be between 0.0 and 1.0")
        @DecimalMax(value = "1.0", message = "Discount rate must be between 0.0 and 1.0")
        Double discountRate,

        ClubStatus status
) {}
