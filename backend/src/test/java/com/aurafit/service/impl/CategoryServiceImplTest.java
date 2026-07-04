package com.aurafit.service.impl;

import com.aurafit.dto.request.CategoryCreateRequest;
import com.aurafit.dto.request.CategoryUpdateRequest;
import com.aurafit.dto.response.CategoryResponse;
import com.aurafit.dto.response.CategoryTreeResponse;
import com.aurafit.entity.Category;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ConflictException;
import com.aurafit.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    void createRootCategory_shouldGenerateSlugAndPath() {
        when(categoryRepository.findByPath("su-kien")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            category.setId(1L);
            return category;
        });

        CategoryResponse response = categoryService.createCategory(new CategoryCreateRequest(
                "Sự kiện",
                null,
                "Danh mục gốc",
                null,
                0,
                true
        ));

        assertEquals(1L, response.id());
        assertEquals("Sự kiện", response.name());
        assertEquals("su-kien", response.slug());
        assertEquals("su-kien", response.path());
        assertNull(response.parentId());
        assertEquals(0, response.sortOrder());
        assertEquals(true, response.isActive());
    }

    @Test
    void createChildCategory_shouldBuildPathFromParent() {
        Category parent = category(10L, "Sự kiện", "su-kien", "su-kien", null);

        when(categoryRepository.findByIdAndIsActiveTrue(10L)).thenReturn(Optional.of(parent));
        when(categoryRepository.findByPath("su-kien/vest-trang-trong")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            category.setId(11L);
            return category;
        });

        CategoryResponse response = categoryService.createCategory(new CategoryCreateRequest(
                "Vest & trang trọng",
                null,
                "Danh mục con",
                10L,
                1,
                true
        ));

        assertEquals(11L, response.id());
        assertEquals("vest-trang-trong", response.slug());
        assertEquals("su-kien/vest-trang-trong", response.path());
        assertEquals(10L, response.parentId());
        assertEquals("Sự kiện", response.parentName());
    }

    @Test
    void createCategory_shouldAllowDuplicateNameAcrossDifferentBranches() {
        Category cosplay = category(1L, "Cosplay", "cosplay", "cosplay", null);
        Category accessory = category(2L, "Phụ kiện", "phu-kien", "phu-kien", null);

        when(categoryRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(cosplay));
        when(categoryRepository.findByIdAndIsActiveTrue(2L)).thenReturn(Optional.of(accessory));
        when(categoryRepository.findByPath("cosplay/anime")).thenReturn(Optional.empty());
        when(categoryRepository.findByPath("phu-kien/anime")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResponse cosplayAnime = categoryService.createCategory(new CategoryCreateRequest(
                "Anime",
                null,
                "Nhánh cosplay",
                1L,
                0,
                true
        ));
        CategoryResponse wigAnime = categoryService.createCategory(new CategoryCreateRequest(
                "Anime",
                null,
                "Nhánh phụ kiện",
                2L,
                0,
                true
        ));

        assertEquals("Anime", cosplayAnime.name());
        assertEquals("cosplay/anime", cosplayAnime.path());
        assertEquals("Anime", wigAnime.name());
        assertEquals("phu-kien/anime", wigAnime.path());
    }

    @Test
    void createCategory_shouldRejectDuplicatePath() {
        Category existing = category(1L, "Sự kiện", "su-kien", "su-kien", null);
        when(categoryRepository.findByPath("su-kien")).thenReturn(Optional.of(existing));

        assertThrows(ConflictException.class, () -> categoryService.createCategory(new CategoryCreateRequest(
                "Sự kiện",
                null,
                "Trùng path",
                null,
                0,
                true
        )));

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void getCategoryTree_shouldReturnNestedTree() {
        Category root = category(1L, "Sự kiện", "su-kien", "su-kien", null);
        Category child = category(2L, "Vest & trang trọng", "vest-trang-trong", "su-kien/vest-trang-trong", root);
        Category leaf = category(3L, "Vest nam", "vest-nam", "su-kien/vest-trang-trong/vest-nam", child);
        Category secondRoot = category(4L, "Cosplay", "cosplay", "cosplay", null);

        when(categoryRepository.findByIsActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(root, child, leaf, secondRoot));

        List<CategoryTreeResponse> tree = categoryService.getCategoryTree();

        assertEquals(2, tree.size());
        assertEquals("Sự kiện", tree.get(0).name());
        assertEquals(1, tree.get(0).children().size());
        assertEquals("Vest & trang trọng", tree.get(0).children().get(0).name());
        assertEquals(1, tree.get(0).children().get(0).children().size());
        assertEquals("Vest nam", tree.get(0).children().get(0).children().get(0).name());
        assertEquals("Cosplay", tree.get(1).name());
    }

    @Test
    void updateCategory_shouldRebuildDescendantPathsWhenSlugChanges() {
        Category root = category(1L, "Sự kiện", "su-kien", "su-kien", null);
        Category category = category(2L, "Vest & trang trọng", "vest-trang-trong", "su-kien/vest-trang-trong", root);
        Category child = category(3L, "Vest nam", "vest-nam", "su-kien/vest-trang-trong/vest-nam", category);

        when(categoryRepository.findById(2L)).thenReturn(Optional.of(category));
        when(categoryRepository.findByPath("su-kien/trang-phuc-trang-trong")).thenReturn(Optional.empty());
        when(categoryRepository.findByPath("su-kien/trang-phuc-trang-trong/vest-nam")).thenReturn(Optional.empty());
        when(categoryRepository.findByParentIdOrderBySortOrderAsc(2L)).thenReturn(List.of(child));
        when(categoryRepository.findByParentIdOrderBySortOrderAsc(3L)).thenReturn(List.of());
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResponse response = categoryService.updateCategory(2L, new CategoryUpdateRequest(
                null,
                "trang-phuc-trang-trong",
                null,
                null,
                null,
                null
        ));

        assertEquals("trang-phuc-trang-trong", response.slug());
        assertEquals("su-kien/trang-phuc-trang-trong", response.path());
        assertEquals("su-kien/trang-phuc-trang-trong/vest-nam", child.getPath());
    }

    @Test
    void updateCategory_shouldRejectParentCycle() {
        Category root = category(1L, "Cosplay", "cosplay", "cosplay", null);
        Category child = category(2L, "Anime", "anime", "cosplay/anime", root);
        Category grandChild = category(3L, "Naruto", "naruto", "cosplay/anime/naruto", child);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(root));
        when(categoryRepository.findByIdAndIsActiveTrue(3L)).thenReturn(Optional.of(grandChild));

        assertThrows(BadRequestException.class, () -> categoryService.updateCategory(1L, new CategoryUpdateRequest(
                null,
                null,
                null,
                3L,
                null,
                null
        )));

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void deleteCategory_shouldSoftDeleteCategory() {
        Category category = category(9L, "Phụ kiện", "phu-kien", "phu-kien", null);

        when(categoryRepository.findById(9L)).thenReturn(Optional.of(category));
        when(categoryRepository.findByParentIdOrderBySortOrderAsc(9L)).thenReturn(List.of());
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        categoryService.deleteCategory(9L);

        assertFalse(category.getIsActive());
        verify(categoryRepository).save(category);
    }

    private Category category(Long id, String name, String slug, String path, Category parent) {
        Category category = Category.builder()
                .id(id)
                .name(name)
                .slug(slug)
                .path(path)
                .description(name + " description")
                .parent(parent)
                .sortOrder(0)
                .isActive(true)
                .children(new ArrayList<>())
                .costumes(new ArrayList<>())
                .build();

        if (parent != null) {
            if (parent.getChildren() == null) {
                parent.setChildren(new ArrayList<>());
            }
            parent.getChildren().add(category);
        }

        assertNotNull(category.getCostumes());
        return category;
    }
}
