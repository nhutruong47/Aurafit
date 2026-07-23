package com.aurafit.service.stylist.impl;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.Category;
import com.aurafit.repository.CategoryRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StylistCategoryResolverTest {

    private final CategoryRepository categoryRepository = mock(CategoryRepository.class);
    private final StylistCategoryResolver resolver = new StylistCategoryResolver(categoryRepository);

    @Test
    void resolve_shouldRefineEventCategoryToGalaParent() {
        when(categoryRepository.findByIsActiveTrueOrderBySortOrderAsc()).thenReturn(categories());
        StylistFilterCriteria criteria = criteria("su-kien", "dạ hội", null);

        StylistFilterCriteria resolved = resolver.resolve(criteria, "tôi muốn đi dạ hội");

        assertEquals("su-kien/da-hoi", resolved.category());
    }

    @Test
    void resolve_shouldRefineEventCategoryToFormalWearParent() {
        when(categoryRepository.findByIsActiveTrueOrderBySortOrderAsc()).thenReturn(categories());
        StylistFilterCriteria criteria = criteria("su-kien", "đám cưới", List.of("vest"));

        StylistFilterCriteria resolved = resolver.resolve(
                criteria,
                "tôi muốn đi đám cưới muốn chọn vest đen để đi"
        );

        assertEquals("su-kien/vest-trang-trong", resolved.category());
    }

    @Test
    void resolve_shouldDiscardInventedCategoryWhenItIsAmbiguousAcrossTrees() {
        when(categoryRepository.findByIsActiveTrueOrderBySortOrderAsc()).thenReturn(categories());
        StylistFilterCriteria criteria = criteria("ao-vest", null, null);

        StylistFilterCriteria resolved = resolver.resolve(criteria, "áo vest");

        assertNull(resolved.category());
    }

    @Test
    void resolve_shouldPreserveRequestedItemWhenNoCategoryMatches() {
        when(categoryRepository.findByIsActiveTrueOrderBySortOrderAsc()).thenReturn(categories());
        StylistFilterCriteria criteria = new StylistFilterCriteria(
                null,
                "bikini",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        StylistFilterCriteria resolved = resolver.resolve(criteria, "Shop có bikini không?");

        assertNull(resolved.category());
        assertEquals("bikini", resolved.requestedItem());
    }

    private StylistFilterCriteria criteria(String category, String occasion, List<String> tags) {
        return new StylistFilterCriteria(
                category,
                null,
                occasion,
                null,
                null,
                null,
                tags,
                null,
                null
        );
    }

    private List<Category> categories() {
        return List.of(
                category(1L, "Sự kiện", "su-kien", "su-kien"),
                category(2L, "Dạ hội", "da-hoi", "su-kien/da-hoi"),
                category(3L, "Đầm dạ hội", "dam-da-hoi", "su-kien/da-hoi/dam-da-hoi"),
                category(4L, "Đầm prom", "dam-prom", "su-kien/da-hoi/dam-prom"),
                category(5L, "Vest & trang trọng", "vest-trang-trong", "su-kien/vest-trang-trong"),
                category(6L, "Vest nam", "vest-nam", "su-kien/vest-trang-trong/vest-nam"),
                category(7L, "Vest nữ", "vest-nu", "su-kien/vest-trang-trong/vest-nu"),
                category(8L, "Kỷ yếu", "ky-yeu", "ky-yeu"),
                category(9L, "Vest tốt nghiệp", "vest-tot-nghiep", "ky-yeu/vest-tot-nghiep"),
                category(10L, "Vest nam", "vest-nam", "ky-yeu/vest-tot-nghiep/vest-nam")
        );
    }

    private Category category(Long id, String name, String slug, String path) {
        return Category.builder()
                .id(id)
                .name(name)
                .slug(slug)
                .path(path)
                .isActive(true)
                .build();
    }
}
