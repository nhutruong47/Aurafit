package com.aurafit.business.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryCreateRequest(
        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 100, message = "Tên danh mục không được vượt quá 100 ký tự")
        String name,

        @Size(max = 120, message = "Slug danh mục không được vượt quá 120 ký tự")
        String slug,

        @Size(max = 1000, message = "Mô tả danh mục không được vượt quá 1000 ký tự")
        String description,

        Long parentId,

        Integer sortOrder,

        Boolean isActive
) {}
