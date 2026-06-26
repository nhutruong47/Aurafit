package com.aurafit.dto.request;

import jakarta.validation.constraints.Size;

public record CategoryUpdateRequest(
        @Size(min = 1, max = 100, message = "Category name must be between 1 and 100 characters")
        String name,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description
) {}
