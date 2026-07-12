package com.aurafit.dto.response;

import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;

import java.math.BigDecimal;

public record AdminCostumeDTO(
        Long id,
        String name,
        String description,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        CostumeStatus status,
        CategoryDTO category,

        CostumeMetadataDTO metadata,
        int availableItemCount,
        String createdAt,
        String updatedAt
) {
    public static AdminCostumeDTO fromEntity(Costume costume) {
        long availableCount = costume.getItems().stream()
                .filter(item -> item.getStatus() == com.aurafit.enums.ItemStatus.AVAILABLE)
                .count();

        return new AdminCostumeDTO(
                costume.getId(),
                costume.getName(),
                costume.getDescription(),
                costume.getRentalPrice(),
                costume.getDepositPrice(),
                costume.getImageUrl(),
                costume.getStatus(),
                CategoryDTO.fromEntity(costume.getCategory()),

                CostumeMetadataDTO.fromEntity(costume.getMetadata()),
                (int) availableCount,
                costume.getCreatedAt() != null ? costume.getCreatedAt().toString() : null,
                costume.getUpdatedAt() != null ? costume.getUpdatedAt().toString() : null
        );
    }
}
