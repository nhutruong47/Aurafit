package com.aurafit.service;

import com.aurafit.dto.request.CategoryCreateRequest;
import com.aurafit.dto.request.CategoryUpdateRequest;
import com.aurafit.dto.response.CategoryResponse;
import com.aurafit.dto.response.CategoryTreeResponse;
import com.aurafit.dto.response.PaginatedResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryCreateRequest request);

    CategoryResponse updateCategory(Long id, CategoryUpdateRequest request);

    void deleteCategory(Long id);

    CategoryResponse getCategoryById(Long id);

    CategoryResponse getCategoryByPath(String path);

    List<CategoryResponse> getAllCategories();

    List<CategoryResponse> getRootCategories();

    List<CategoryResponse> getChildrenByCategoryId(Long parentId);

    List<CategoryTreeResponse> getCategoryTree();

    PaginatedResponse<CategoryResponse> searchCategories(String keyword, int pageNo, int pageSize, String sortBy, String sortDir);
}
