package com.aurafit.dto.response;

import com.aurafit.entity.Costume;

import java.math.BigDecimal;

public record CatalogCostumeDTO(
        Long id,
        String name,
        String slug,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        String categoryName,
        boolean isAvailable
) {
    public static CatalogCostumeDTO fromEntity(Costume costume) {
        return new CatalogCostumeDTO(
                costume.getId(),
                costume.getName(),
                costume.getSlug(),
                costume.getRentalPrice(),
                costume.getDepositPrice(),
                costume.getImageUrl(),
                costume.getCategory().getName(),
                costume.getAvailableItemCount() > 0
        );
    }
}
