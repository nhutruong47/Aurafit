package com.aurafit.service;

import com.aurafit.dto.request.CategoryCreateRequest;
import com.aurafit.dto.request.CategoryUpdateRequest;
import com.aurafit.dto.response.CategoryDTO;
import com.aurafit.dto.response.PaginatedResponse;

import java.util.List;

public interface CategoryService {

    CategoryDTO createCategory(CategoryCreateRequest request);

    CategoryDTO updateCategory(Long id, CategoryUpdateRequest request);

    void deleteCategory(Long id);

    CategoryDTO getCategoryById(Long id);

    List<CategoryDTO> getAllCategories();

    PaginatedResponse<CategoryDTO> searchCategories(String keyword, int pageNo, int pageSize, String sortBy, String sortDir);
}
