package com.aurafit.ai.analytics.dto.response;

public record TopCostumeDTO(
        String costumeName,
        String sku,
        Long totalRented
) {}
