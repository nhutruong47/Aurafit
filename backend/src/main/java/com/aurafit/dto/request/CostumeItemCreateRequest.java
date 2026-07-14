package com.aurafit.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CostumeItemCreateRequest(
        @NotBlank(message = "SKU is required")
        String sku,

        @NotBlank(message = "Size is required")
        String size,

        @NotBlank(message = "Color is required")
        String color,

        String status
) {}
