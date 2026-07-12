package com.aurafit.dto.request;

import jakarta.validation.Valid;

import java.math.BigDecimal;

public record CostumeUpdateRequest(
        String name,
        String slug,
        String description,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        Long categoryId,

        String status,

        @Valid
        CostumeMetadataUpsertRequest metadata
) {}
