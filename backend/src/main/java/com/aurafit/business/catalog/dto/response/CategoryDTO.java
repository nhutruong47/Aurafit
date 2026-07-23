package com.aurafit.business.catalog.dto.response;

import com.aurafit.business.catalog.entity.Category;

/**
 * Read-only projection of the Category entity for API responses.
 */
public record CategoryDTO(
        Long id,
        String name,
        String slug,
        String path,
        String description,
        Long parentId,
        String parentName,
        Integer sortOrder,
        Boolean isActive
) {
    public static CategoryDTO fromEntity(Category category) {
        if (category == null) {
            return null;
        }

        return new CategoryDTO(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getPath(),
                category.getDescription(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getParent() != null ? category.getParent().getName() : null,
                category.getSortOrder(),
                category.getIsActive()
        );
    }
}
