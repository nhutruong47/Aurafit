package com.aurafit.dto.response;

import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;

import java.math.BigDecimal;

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
        CategoryDTO category,
        CostumeMetadataDTO metadata
) {
    /**
     * Maps a Costume entity (with its Category already fetched via JOIN FETCH)
     * to a flat, serialization-safe DTO.
     *
     * @param costume The entity to map. Its {@code category} must be initialized.
     * @return A new CostumeDTO.
     */
    public static CostumeDTO fromEntity(Costume costume) {
        return new CostumeDTO(
                costume.getId(),
                costume.getName(),
                costume.getDescription(),
                costume.getRentalPrice(),
                costume.getDepositPrice(),
                costume.getImageUrl(),
                costume.getStatus(),
                CategoryDTO.fromEntity(costume.getCategory()),
                CostumeMetadataDTO.fromEntity(costume.getMetadata())
        );
    }
}
