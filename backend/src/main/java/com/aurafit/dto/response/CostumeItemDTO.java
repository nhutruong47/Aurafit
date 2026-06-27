package com.aurafit.dto.response;

import com.aurafit.entity.CostumeItem;
import com.aurafit.enums.ItemStatus;

public record CostumeItemDTO(
        Long id,
        String sku,
        String size,
        String color,
        ItemStatus status
) {
    public static CostumeItemDTO fromEntity(CostumeItem item) {
        return new CostumeItemDTO(
                item.getId(),
                item.getSku(),
                item.getSize(),
                item.getColor(),
                item.getStatus()
        );
    }
}
