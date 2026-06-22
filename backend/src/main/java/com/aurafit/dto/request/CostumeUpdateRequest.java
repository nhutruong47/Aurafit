package com.aurafit.dto.request;

import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CostumeUpdateRequest(
        String name,
        String description,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        Long categoryId,
        String status
) {}
