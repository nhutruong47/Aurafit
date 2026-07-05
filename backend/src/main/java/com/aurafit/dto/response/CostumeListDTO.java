package com.aurafit.dto.response;

import com.aurafit.enums.CostumeStatus;

import java.math.BigDecimal;

public record CostumeListDTO(
        Long id,
        String name,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        CostumeStatus status,
        Long categoryId,
        String categoryName,
        String categorySlug,
        String categoryPath,
        long availableItemCount
) {
}
