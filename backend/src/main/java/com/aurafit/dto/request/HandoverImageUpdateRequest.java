package com.aurafit.dto.request;

import jakarta.validation.constraints.NotBlank;

public record HandoverImageUpdateRequest(
        @NotBlank(message = "imageUrl is required")
        String imageUrl
) {}
