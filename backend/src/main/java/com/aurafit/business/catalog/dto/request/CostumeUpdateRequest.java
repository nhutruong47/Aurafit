package com.aurafit.business.catalog.dto.request;

import com.aurafit.ai.enrichment.dto.request.CostumeMetadataUpsertRequest;
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
