package com.aurafit.service.impl;

import com.aurafit.dto.request.CategoryCreateRequest;
import com.aurafit.dto.request.CategoryUpdateRequest;
import com.aurafit.dto.response.CategoryResponse;
import com.aurafit.dto.response.CategoryTreeResponse;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.entity.Category;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ConflictException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.service.CategoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        String normalizedName = requireCategoryName(request.name());
        Category parent = resolveActiveParent(request.parentId());
        String slug = resolveSlugForCreate(request.slug(), normalizedName);
        String path = buildPath(parent, slug);

        validateUniquePath(path, null);

        Category category = Category.builder()
                .name(normalizedName)
                .slug(slug)
                .path(path)
                .description(normalizeDescription(request.description()))
                .parent(parent)
                .sortOrder(normalizeSortOrder(request.sortOrder()))
                .isActive(normalizeIsActive(request.isActive()))
                .build();

        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryUpdateRequest request) {
        Category category = findCategoryById(id);

        if (request.name() != null) {
            category.setName(requireCategoryName(request.name()));
        }

        if (request.description() != null) {
            category.setDescription(normalizeDescription(request.description()));
        }

        if (request.sortOrder() != null) {
            category.setSortOrder(normalizeSortOrder(request.sortOrder()));
        }

        if (request.isActive() != null) {
            category.setIsActive(request.isActive());
        }

        boolean slugChanged = false;
        if (request.slug() != null) {
            String normalizedSlug = slugify(request.slug());
            if (!normalizedSlug.equals(category.getSlug())) {
                category.setSlug(normalizedSlug);
                slugChanged = true;
            }
        }

        boolean parentChanged = false;
        if (request.parentId() != null) {
            Category newParent = findActiveCategoryById(request.parentId());

            if (Objects.equals(category.getId(), newParent.getId())) {
                throw new BadRequestException("Không thể đặt danh mục cha là chính nó.");
            }

            if (isDescendantOf(newParent, category.getId())) {
                throw new BadRequestException("Không thể chuyển danh mục vào chính nhánh con của nó.");
            }

            Long currentParentId = category.getParent() != null ? category.getParent().getId() : null;
            if (!Objects.equals(currentParentId, newParent.getId())) {
                category.setParent(newParent);
                parentChanged = true;
            }
        }

        if (slugChanged || parentChanged) {
            String rebuiltPath = buildPath(category.getParent(), category.getSlug());
            validateUniquePath(rebuiltPath, category.getId());
            category.setPath(rebuiltPath);
            rebuildDescendantPaths(category);
        }

        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = findCategoryById(id);

        if (!categoryRepository.findByParentIdOrderBySortOrderAsc(id).isEmpty()) {
            throw new ConflictException("Không thể ẩn danh mục đang có danh mục con. Vui lòng xử lý các danh mục con trước.");
        }

        if (category.getCostumes() != null && !category.getCostumes().isEmpty()) {
            throw new ConflictException("Không thể ẩn danh mục đang có trang phục liên kết.");
        }

        category.setIsActive(false);
        categoryRepository.save(category);
    }

    @Override
    public CategoryResponse getCategoryById(Long id) {
        return CategoryResponse.fromEntity(findCategoryById(id));
    }

    @Override
    public CategoryResponse getCategoryByPath(String path) {
        String normalizedPath = requirePath(path);
        Category category = categoryRepository.findByPathAndIsActiveTrue(normalizedPath)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với đường dẫn: " + normalizedPath));
        return CategoryResponse.fromEntity(category);
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findByIsActiveTrueOrderBySortOrderAsc().stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    public List<CategoryResponse> getRootCategories() {
        return categoryRepository.findByParentIsNullAndIsActiveTrueOrderBySortOrderAsc().stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    public List<CategoryResponse> getChildrenByCategoryId(Long parentId) {
        findActiveCategoryById(parentId);

        return categoryRepository.findByParentIdAndIsActiveTrueOrderBySortOrderAsc(parentId).stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    public List<CategoryTreeResponse> getCategoryTree() {
        List<Category> activeCategories = categoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
        Map<Long, List<Category>> childrenByParentId = new LinkedHashMap<>();

        for (Category category : activeCategories) {
            Long parentId = category.getParent() != null ? category.getParent().getId() : null;
            childrenByParentId.computeIfAbsent(parentId, ignored -> new java.util.ArrayList<>()).add(category);
        }

        return buildTree(childrenByParentId, null);
    }

    @Override
    public PaginatedResponse<CategoryResponse> searchCategories(String keyword, int pageNo, int pageSize, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);
        String normalizedKeyword = keyword == null ? "" : keyword.trim();

        Page<Category> page = categoryRepository.searchCategories(normalizedKeyword, pageable);
        return PaginatedResponse.from(page, CategoryResponse::fromEntity);
    }

    private List<CategoryTreeResponse> buildTree(Map<Long, List<Category>> childrenByParentId, Long parentId) {
        return childrenByParentId.getOrDefault(parentId, List.of()).stream()
                .map(category -> new CategoryTreeResponse(
                        category.getId(),
                        category.getName(),
                        category.getSlug(),
                        category.getPath(),
                        category.getDescription(),
                        category.getSortOrder(),
                        category.getIsActive(),
                        buildTree(childrenByParentId, category.getId())
                ))
                .toList();
    }

    private void rebuildDescendantPaths(Category parent) {
        List<Category> children = categoryRepository.findByParentIdOrderBySortOrderAsc(parent.getId());

        for (Category child : children) {
            String childPath = buildPath(parent, child.getSlug());
            validateUniquePath(childPath, child.getId());
            child.setPath(childPath);
            rebuildDescendantPaths(child);
        }
    }

    private boolean isDescendantOf(Category candidateParent, Long categoryId) {
        Category current = candidateParent;

        while (current != null) {
            if (Objects.equals(current.getId(), categoryId)) {
                return true;
            }
            current = current.getParent();
        }

        return false;
    }

    private void validateUniquePath(String path, Long currentCategoryId) {
        categoryRepository.findByPath(path)
                .filter(existing -> !Objects.equals(existing.getId(), currentCategoryId))
                .ifPresent(existing -> {
                    throw new ConflictException("Đường dẫn danh mục đã tồn tại: " + path);
                });
    }

    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));
    }

    private Category findActiveCategoryById(Long id) {
        return categoryRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục đang hoạt động với id: " + id));
    }

    private Category resolveActiveParent(Long parentId) {
        if (parentId == null) {
            return null;
        }
        return findActiveCategoryById(parentId);
    }

    private String requireCategoryName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new BadRequestException("Tên danh mục không được để trống.");
        }
        return name.trim();
    }

    private String resolveSlugForCreate(String requestedSlug, String name) {
        String source = requestedSlug == null || requestedSlug.trim().isEmpty() ? name : requestedSlug;
        return slugify(source);
    }

    private String slugify(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException("Slug danh mục không được để trống.");
        }

        String normalized = Normalizer.normalize(
                        value.replace('Đ', 'D').replace('đ', 'd'),
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "")
                .toLowerCase(Locale.ROOT);

        if (normalized.isBlank()) {
            throw new BadRequestException("Slug danh mục không hợp lệ.");
        }

        return normalized;
    }

    private String buildPath(Category parent, String slug) {
        return parent == null ? slug : parent.getPath() + "/" + slug;
    }

    private Integer normalizeSortOrder(Integer sortOrder) {
        return sortOrder == null ? 0 : sortOrder;
    }

    private Boolean normalizeIsActive(Boolean isActive) {
        return isActive == null ? Boolean.TRUE : isActive;
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }

        String trimmed = description.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String requirePath(String path) {
        if (path == null || path.trim().isEmpty()) {
            throw new BadRequestException("Đường dẫn danh mục không được để trống.");
        }
        return path.trim().toLowerCase(Locale.ROOT);
    }
}
