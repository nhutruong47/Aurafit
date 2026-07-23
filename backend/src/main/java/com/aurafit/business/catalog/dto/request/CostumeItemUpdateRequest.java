package com.aurafit.business.catalog.dto.request;

public record CostumeItemUpdateRequest(
        String sku,
        String size,
        String color,
        String status
) {}
