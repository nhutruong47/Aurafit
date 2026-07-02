package com.aurafit.dto.response;

public record InventorySummaryDTO(
    Long costumeId,
    String color,
    String size,
    long availableCount,
    long alreadyInCartCount
) {
    public InventorySummaryDTO(Long costumeId, String color, String size, long availableCount) {
        this(costumeId, color, size, availableCount, 0);
    }
}
