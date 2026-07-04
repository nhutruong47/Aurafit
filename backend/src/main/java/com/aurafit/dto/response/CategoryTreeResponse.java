package com.aurafit.dto.response;

import com.aurafit.entity.Category;

import java.util.List;

public record CategoryTreeResponse(
        Long id,
        String name,
        String slug,
        String path,
        String description,
        Integer sortOrder,
        Boolean isActive,
        List<CategoryTreeResponse> children
) {
    public static CategoryTreeResponse fromEntity(Category category) {
        if (category == null) {
            return null;
        }

        List<CategoryTreeResponse> childResponses = category.getChildren() == null
                ? List.of()
                : category.getChildren().stream()
                .map(CategoryTreeResponse::fromEntity)
                .toList();

        return new CategoryTreeResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getPath(),
                category.getDescription(),
                category.getSortOrder(),
                category.getIsActive(),
                childResponses
        );
    }
}
