package com.aurafit.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.Valid;

import java.math.BigDecimal;

public record CostumeCreateRequest(
        @NotBlank(message = "Name is required")
        String name,

        String description,

        @NotNull(message = "Rental price is required")
        @Positive(message = "Rental price must be positive")
        BigDecimal rentalPrice,

        @NotNull(message = "Deposit price is required")
        @Positive(message = "Deposit price must be positive")
        BigDecimal depositPrice,

        String imageUrl,

        @NotNull(message = "Category ID is required")
        Long categoryId,

        @Valid
        CostumeMetadataUpsertRequest metadata
) {}
