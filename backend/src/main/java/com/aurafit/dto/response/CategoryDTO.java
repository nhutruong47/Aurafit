package com.aurafit.dto.response;

import com.aurafit.entity.Category;

/**
 * Read-only projection of the Category entity for API responses.
 */
public record CategoryDTO(
        Long id,
        String name,
        String description
) {
    public static CategoryDTO fromEntity(Category category) {
        return new CategoryDTO(
                category.getId(),
                category.getName(),
                category.getDescription()
        );
    }
}
