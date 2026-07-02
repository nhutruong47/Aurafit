package com.aurafit.service.impl;

import com.aurafit.dto.response.CategoryDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.CostumeListDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
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

import java.util.Collections;
import java.util.List;

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
    public PaginatedResponse<CostumeListDTO> getAllActiveCostumes(Long categoryId, String keyword,
                                                                  int pageNo, int pageSize,
                                                                  String sortBy, String sortDir, Long userId) {
        // Build Sort object from parameters
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);

        // Normalize null keyword to empty string so 'LIKE %%' matches all
        String normalizedKeyword = (keyword == null) ? "" : keyword.trim();

        Page<CostumeListDTO> page = costumeRepository.findAllSummariesWithFilters(
                CostumeStatus.ACTIVE,
                ItemStatus.AVAILABLE,
                categoryId,
                normalizedKeyword,
                pageable
        );

        return PaginatedResponse.from(page, costume -> costume);
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
        return categoryRepository.findAll()
                .stream()
                .map(CategoryDTO::fromEntity)
                .toList();
    }

    @Override
    public List<CostumeDTO> getSeasonalCostumes(int limit) {
        return costumeRepository.findSeasonalCostumes(CostumeStatus.ACTIVE,
                        org.springframework.data.domain.PageRequest.of(0, limit))
                .stream()
                .map(CostumeDTO::fromEntity)
                .toList();
    }

    @Override
    public List<CostumeDTO> getRecommendedCostumes(Long userId, int limit) {
        List<Costume> costumes = costumeRepository
                .findActiveCostumesForRecommendations(CostumeStatus.ACTIVE);
        Collections.shuffle(costumes);
        return costumes.stream()
                .limit(limit)
                .map(CostumeDTO::fromEntity)
                .toList();
    }
}
