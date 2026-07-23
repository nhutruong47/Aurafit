package com.aurafit.ai.enrichment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CostumeMetadataUpsertRequest(
        @NotBlank(message = "Style is required")
        String style,

        @NotBlank(message = "Occasion is required")
        String occasion,

        @NotBlank(message = "Season is required")
        String season,

        @NotBlank(message = "Color is required")
        String color,

        @NotEmpty(message = "At least one tag is required")
        List<@NotBlank(message = "Tag must not be blank") String> tags,

        String skinTone,
        String bodyType,
        String gender,
        String size,
        String material,
        String fitNote
) {}
