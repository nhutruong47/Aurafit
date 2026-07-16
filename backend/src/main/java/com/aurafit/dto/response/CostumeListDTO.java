package com.aurafit.dto.response;

import com.aurafit.enums.CostumeStatus;

import java.math.BigDecimal;
import java.util.List;

public record CostumeListDTO(
        Long id,
        String name,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        List<String> imageUrls,
        CostumeStatus status,
        Long categoryId,
        String categoryName,
        String categorySlug,
        String categoryPath,
        long availableItemCount
) {
}
