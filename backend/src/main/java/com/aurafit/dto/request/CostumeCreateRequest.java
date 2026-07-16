package com.aurafit.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.List;

public record CostumeCreateRequest(
        @NotBlank(message = "Name is required")
        String name,

        String slug,

        String description,

        @NotNull(message = "Rental price is required")
        @Positive(message = "Rental price must be positive")
        BigDecimal rentalPrice,

        @NotNull(message = "Deposit price is required")
        @Positive(message = "Deposit price must be positive")
        BigDecimal depositPrice,

        // deprecated, dùng imageUrls
        String imageUrl,

        List<String> imageUrls,

        @NotNull(message = "Category ID is required")
        Long categoryId,



        @Valid
        CostumeMetadataUpsertRequest metadata
) {}
