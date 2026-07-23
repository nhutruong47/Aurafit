package com.aurafit.business.catalog.dto.response;

import com.aurafit.business.catalog.entity.Category;

public record CategoryResponse(
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
    public static CategoryResponse fromEntity(Category category) {
        if (category == null) {
            return null;
        }

        return new CategoryResponse(
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
