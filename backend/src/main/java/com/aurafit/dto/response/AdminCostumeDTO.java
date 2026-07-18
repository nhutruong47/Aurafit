package com.aurafit.dto.response;

import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;

import java.math.BigDecimal;
import java.util.List;

public record AdminCostumeDTO(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        List<String> imageUrls,
        CostumeStatus status,
        CategoryDTO category,

        CostumeMetadataDTO metadata,
        int availableItemCount,
        String createdAt,
        String updatedAt
) {
    public static AdminCostumeDTO fromEntity(Costume costume) {
        long pooledCount = costume.getItems().stream()
                .filter(item -> item.getStatus() == com.aurafit.enums.ItemStatus.AVAILABLE
                        || item.getStatus() == com.aurafit.enums.ItemStatus.RESERVED)
                .count();

        return new AdminCostumeDTO(
                costume.getId(),
                costume.getName(),
                costume.getSlug(),
                costume.getDescription(),
                costume.getRentalPrice(),
                costume.getDepositPrice(),
                costume.getPrimaryImageUrl(),
                costume.getAllImageUrls(),
                costume.getStatus(),
                CategoryDTO.fromEntity(costume.getCategory()),

                CostumeMetadataDTO.fromEntity(costume.getMetadata()),
                (int) pooledCount,
                costume.getCreatedAt() != null ? costume.getCreatedAt().toString() : null,
                costume.getUpdatedAt() != null ? costume.getUpdatedAt().toString() : null
        );
    }
}
