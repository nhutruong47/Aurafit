package com.aurafit.dto.response;

import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;

import java.math.BigDecimal;
import java.util.List;

/**
 * Read-only projection of the Costume entity for API responses.
 * The category is represented as a {@link CategoryDTO}, never as the raw entity,
 * preventing lazy-loading surprises and circular serialization.
 */
public record CostumeDTO(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        List<String> imageUrls,
        CostumeStatus status,
        int availableItemCount,
        Double averageRating,
        Long reviewCount,
        CategoryDTO category,

        CostumeMetadataDTO metadata,
        List<CostumeItemDTO> items,
        List<InventorySummaryDTO> inventorySummary
) {
    public static CostumeDTO fromSummaryEntity(Costume costume) {
        long pooledCount = costume.getItems() == null ? 0 :
                costume.getItems().stream()
                        .filter(item -> item.getStatus() == com.aurafit.enums.ItemStatus.AVAILABLE
                                || item.getStatus() == com.aurafit.enums.ItemStatus.RESERVED)
                        .count();

        return fromSummaryEntity(costume, (int) pooledCount);
    }

    public static CostumeDTO fromSummaryEntity(Costume costume, int availableCount) {
        return new CostumeDTO(
                costume.getId(),
                costume.getName(),
                costume.getSlug(),
                costume.getDescription(),
                costume.getRentalPrice(),
                costume.getDepositPrice(),
                costume.getPrimaryImageUrl(),
                costume.getAllImageUrls(),
                costume.getStatus(),
                availableCount,
                normalizeAverageRating(costume.getAverageRating()),
                costume.getReviewCount() == null ? 0L : costume.getReviewCount(),
                CategoryDTO.fromEntity(costume.getCategory()),
                CostumeMetadataDTO.fromEntity(costume.getMetadata()),
                List.of(),
                List.of()
        );
    }

    public static CostumeDTO fromEntity(Costume costume, List<InventorySummaryDTO> inventorySummary) {
        // Pooled count (AVAILABLE + RESERVED) so the storefront shows items that are
        // physically on-hand even when some units are temporarily held by a pending order.
        long pooledCount = costume.getItems() == null ? 0 :
                costume.getItems().stream()
                        .filter(item -> item.getStatus() == com.aurafit.enums.ItemStatus.AVAILABLE
                                || item.getStatus() == com.aurafit.enums.ItemStatus.RESERVED)
                        .count();
        return new CostumeDTO(
                costume.getId(),
                costume.getName(),
                costume.getSlug(),
                costume.getDescription(),
                costume.getRentalPrice(),
                costume.getDepositPrice(),
                costume.getPrimaryImageUrl(),
                costume.getAllImageUrls(),
                costume.getStatus(),
                (int) pooledCount,
                normalizeAverageRating(costume.getAverageRating()),
                costume.getReviewCount() == null ? 0L : costume.getReviewCount(),
                CategoryDTO.fromEntity(costume.getCategory()),
                CostumeMetadataDTO.fromEntity(costume.getMetadata()),
                costume.getItems() == null ? List.of() :
                        costume.getItems().stream()
                                .map(CostumeItemDTO::fromEntity)
                                .toList(),
                inventorySummary != null ? inventorySummary : List.of()
        );
    }
    
    public static CostumeDTO fromEntity(Costume costume) {
        return fromEntity(costume, List.of());
    }

    private static double normalizeAverageRating(Double averageRating) {
        if (averageRating == null) {
            return 0.0;
        }
        return Math.round(averageRating * 10.0) / 10.0;
    }
}
