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
        String description,
        BigDecimal rentalPrice,
        BigDecimal depositPrice,
        String imageUrl,
        CostumeStatus status,
        int availableItemCount,
        CategoryDTO category,
        UserResponseDTO owner,
        CostumeMetadataDTO metadata,
        List<CostumeItemDTO> items
) {
    public static CostumeDTO fromEntity(Costume costume) {
        long availableCount = costume.getItems() == null ? 0 :
                costume.getItems().stream()
                        .filter(item -> item.getStatus() == com.aurafit.enums.ItemStatus.AVAILABLE)
                        .count();
        return new CostumeDTO(
                costume.getId(),
                costume.getName(),
                costume.getDescription(),
                costume.getRentalPrice(),
                costume.getDepositPrice(),
                costume.getImageUrl(),
                costume.getStatus(),
                (int) availableCount,
                CategoryDTO.fromEntity(costume.getCategory()),
                costume.getOwner() != null ? new UserResponseDTO(
                        costume.getOwner().getId(),
                        costume.getOwner().getFullName(),
                        costume.getOwner().getEmail(),
                        costume.getOwner().getRole(),
                        costume.getOwner().getStatus()
                ) : null,
                CostumeMetadataDTO.fromEntity(costume.getMetadata()),
                costume.getItems() == null ? List.of() :
                        costume.getItems().stream()
                                .map(CostumeItemDTO::fromEntity)
                                .toList()
        );
    }
}
