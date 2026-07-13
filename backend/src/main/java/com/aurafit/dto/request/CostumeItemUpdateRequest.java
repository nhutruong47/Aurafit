package com.aurafit.dto.request;

public record CostumeItemUpdateRequest(
        String sku,
        String size,
        String color,
        String status
) {}
