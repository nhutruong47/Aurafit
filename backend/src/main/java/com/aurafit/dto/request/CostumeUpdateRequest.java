package com.aurafit.dto.request;

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.List;

public record CostumeUpdateRequest(
        String name,
        String slug,
        String description,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        // deprecated, dùng imageUrls
        String imageUrl,
        List<String> imageUrls,
        Long categoryId,

        String status,

        @Valid
        CostumeMetadataUpsertRequest metadata
) {}
