package com.aurafit.dto.response;

import com.aurafit.entity.Costume;
import com.aurafit.enums.ItemStatus;

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
        // Mirror the pooled (AVAILABLE + RESERVED) logic used by CostumeDTO so the
        // catalog card stays consistent with the product detail page. Relying on the
        // stored `availableItemCount` column would show "Hết hàng" the moment a unit
        // is moved to RESERVED by a pending order, even though the unit is still
        // physically in stock.
        long pooledCount = costume.getItems() == null ? 0L :
                costume.getItems().stream()
                        .filter(item -> item.getStatus() == ItemStatus.AVAILABLE
                                || item.getStatus() == ItemStatus.RESERVED)
                        .count();

        boolean isAvailable = pooledCount > 0;

        // Fall back to the stored column when the items collection is not loaded
        // (e.g. lightweight projections). Otherwise the catalog would silently mark
        // everything as out of stock.
        if (costume.getItems() == null || costume.getItems().isEmpty()) {
            isAvailable = costume.getAvailableItemCount() > 0;
        }

        return new CatalogCostumeDTO(
                costume.getId(),
                costume.getName(),
                costume.getSlug(),
                costume.getRentalPrice(),
                costume.getDepositPrice(),
                costume.getPrimaryImageUrl(),
                costume.getCategory().getName(),
                isAvailable
        );
    }
}
