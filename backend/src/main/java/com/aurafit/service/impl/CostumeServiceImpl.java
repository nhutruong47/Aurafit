package com.aurafit.service.impl;

import com.aurafit.dto.response.CatalogCostumeDTO;
import com.aurafit.dto.response.CategoryDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.InventoryRepository;
import com.aurafit.repository.CartRepository;
import com.aurafit.repository.CartItemRepository;
import com.aurafit.entity.Cart;
import com.aurafit.enums.CartStatus;
import com.aurafit.dto.response.InventorySummaryDTO;
import com.aurafit.service.CostumeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)   // all methods are read-only by default
public class CostumeServiceImpl implements CostumeService {

    private final CostumeRepository costumeRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    public CostumeServiceImpl(CostumeRepository costumeRepository,
                              CategoryRepository categoryRepository,
                              InventoryRepository inventoryRepository,
                              CartRepository cartRepository,
                              CartItemRepository cartItemRepository) {
        this.costumeRepository = costumeRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
    }

    @Override
    public PaginatedResponse<CatalogCostumeDTO> getAllActiveCostumes(Long categoryId, String categoryPath, String keyword,
                                                              int pageNo, int pageSize,
                                                              String sortBy, String sortDir, Long userId) {
        // Build Sort object from parameters
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);

        // Normalize null keyword to empty string so 'LIKE %%' matches all
        String normalizedKeyword = (keyword == null) ? "" : keyword.trim();
        String resolvedCategoryPath = resolveCategoryPath(categoryId, categoryPath);

        Page<Costume> page = costumeRepository.findAllWithFilters(
                CostumeStatus.ACTIVE,
                resolvedCategoryPath,
                normalizedKeyword,
                pageable
        );

        return PaginatedResponse.from(
                page,
                CatalogCostumeDTO::fromEntity
        );
    }

    @Override
    public CostumeDTO getCostumeById(Long id, Long userId) {
        Costume costume = costumeRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", id));
                
        List<InventorySummaryDTO> inventorySummary = inventoryRepository.getInventorySummaryByCostumeId(id, ItemStatus.AVAILABLE);

        if (userId != null) {
            Cart cart = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE).orElse(null);
            if (cart != null) {
                inventorySummary = inventorySummary.stream().map(s -> {
                    long inCart = cartItemRepository.countVariantInCart(cart.getId(), s.costumeId(), s.size(), s.color());
                    return new InventorySummaryDTO(s.costumeId(), s.color(), s.size(), s.availableCount(), inCart);
                }).toList();
            }
        }

        return CostumeDTO.fromEntity(costume, inventorySummary);
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(CategoryDTO::fromEntity)
                .toList();
    }

    @Override
    public List<CatalogCostumeDTO> getSeasonalCostumes(int limit) {
        return costumeRepository.findSeasonalCostumes(CostumeStatus.ACTIVE,
                        org.springframework.data.domain.PageRequest.of(0, limit))
                .stream()
                .map(CatalogCostumeDTO::fromEntity)
                .toList();
    }

    @Override
    public List<CatalogCostumeDTO> getRecommendedCostumes(Long userId, int limit) {
        List<Costume> costumes = costumeRepository
                .findActiveCostumesForRecommendations(CostumeStatus.ACTIVE);
        Collections.shuffle(costumes);
        return costumes.stream()
                .limit(limit)
                .map(CatalogCostumeDTO::fromEntity)
                .toList();
    }

    private String resolveCategoryPath(Long categoryId, String categoryPath) {
        if (categoryPath != null && !categoryPath.trim().isEmpty()) {
            return categoryPath.trim().toLowerCase(Locale.ROOT);
        }

        if (categoryId == null) {
            return null;
        }

        Category category = categoryRepository.findByIdAndIsActiveTrue(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục đang hoạt động với id: " + categoryId));

        if (category.getPath() == null || category.getPath().isBlank()) {
            throw new BadRequestException("Danh mục chưa có đường dẫn hợp lệ để lọc.");
        }

        return category.getPath();
    }

    private Map<Long, Integer> getAvailableCountsByCostumeId(List<Costume> costumes) {
        if (costumes == null || costumes.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Long> costumeIds = costumes.stream()
                .map(Costume::getId)
                .toList();

        Map<Long, Integer> counts = new HashMap<>();
        inventoryRepository.getAvailableItemCountsByCostumeIds(costumeIds, ItemStatus.AVAILABLE)
                .forEach(row -> {
                    Long costumeId = row[0] instanceof Number number ? number.longValue() : null;
                    Integer availableCount = row[1] instanceof Number number ? number.intValue() : 0;
                    if (costumeId != null) {
                        counts.put(costumeId, availableCount);
                    }
                });

        return counts;
    }
}
