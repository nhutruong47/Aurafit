package com.aurafit.service.impl;

import com.aurafit.dto.request.CostumeCreateRequest;
import com.aurafit.dto.request.CostumeUpdateRequest;
import com.aurafit.dto.response.AdminCostumeDTO;
import com.aurafit.dto.response.CatalogCostumeDTO;
import com.aurafit.dto.response.CategoryDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeImage;
import com.aurafit.entity.User;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.Role;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.InventoryRepository;
import com.aurafit.repository.CartRepository;
import com.aurafit.repository.CartItemRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.entity.Cart;
import com.aurafit.enums.CartStatus;
import com.aurafit.dto.response.InventorySummaryDTO;
import com.aurafit.service.CostumeMetadataService;
import com.aurafit.service.CostumeService;
import com.aurafit.service.EventPricingService;
import com.aurafit.service.EventPricingService.ActiveEventOffer;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Collections;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)   // all methods are read-only by default
public class CostumeServiceImpl implements CostumeService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "name",
            "rentalPrice",
            "createdAt"
    );

    private final CostumeRepository costumeRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CostumeMetadataService costumeMetadataService;
    private final InventoryRepository inventoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final EventPricingService eventPricingService;

    public CostumeServiceImpl(CostumeRepository costumeRepository,
                              CategoryRepository categoryRepository,
                              UserRepository userRepository,
                              CostumeMetadataService costumeMetadataService,
                              InventoryRepository inventoryRepository,
                              CartRepository cartRepository,
                              CartItemRepository cartItemRepository,
                              EventPricingService eventPricingService) {
        this.costumeRepository = costumeRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.costumeMetadataService = costumeMetadataService;
        this.inventoryRepository = inventoryRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.eventPricingService = eventPricingService;
    }

    @Override
    public PaginatedResponse<AdminCostumeDTO> getAllCostumes(String authenticatedEmail, int pageNo, int pageSize,
                                                              String sortBy, String sortDir, String keyword,
                                                              String statusStr, Long categoryId) {
        requireProductManager(authenticatedEmail);

        String resolvedSortBy = resolveSortField(sortBy);
        Sort sort = Sort.Direction.ASC.name().equalsIgnoreCase(sortDir)
                ? Sort.by(resolvedSortBy).ascending()
                : Sort.by(resolvedSortBy).descending();
        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);

        CostumeStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !statusStr.equalsIgnoreCase("all")) {
            try {
                status = CostumeStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        String searchKeyword = (keyword != null && !keyword.isBlank()) ? keyword : null;

        Page<Costume> page = costumeRepository.findAllForAdmin(status, categoryId, searchKeyword, pageable);

        List<AdminCostumeDTO> content = page.getContent().stream()
                .map(AdminCostumeDTO::fromEntity)
                .toList();

        return new PaginatedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional
    public AdminCostumeDTO createCostume(CostumeCreateRequest request, String authenticatedEmail) {
        requireProductManager(authenticatedEmail);
        Category category = requireLeafActiveCategory(request.categoryId());

        Costume costume = Costume.builder()
                .name(request.name())
                .slug(request.slug() != null && !request.slug().isBlank()
                        ? request.slug()
                        : generateSlug(request.name()))
                .description(request.description())
                .rentalPrice(request.rentalPrice())
                .depositPrice(request.depositPrice())
                .status(CostumeStatus.ACTIVE)
                .category(category)
                .build();

        applyCostumeImages(costume, resolveImageUrls(request.imageUrl(), request.imageUrls()));
        Costume savedCostume = costumeRepository.save(costume);
        if (request.metadata() != null) {
            costumeMetadataService.upsertMetadata(savedCostume, request.metadata());
        }

        return AdminCostumeDTO.fromEntity(costumeRepository.findByIdWithItems(savedCostume.getId()).orElse(savedCostume));
    }

    @Override
    @Transactional
    public AdminCostumeDTO updateCostume(Long id, CostumeUpdateRequest request, String authenticatedEmail) {
        requireProductManager(authenticatedEmail);
        Costume costume = costumeRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", id));

        if (request.name() != null) costume.setName(request.name());
        if (request.slug() != null) costume.setSlug(request.slug());
        if (request.description() != null) costume.setDescription(request.description());
        if (request.rentalPrice() != null) costume.setRentalPrice(request.rentalPrice());
        if (request.depositPrice() != null) costume.setDepositPrice(request.depositPrice());
        applyCostumeImages(costume, resolveImageUrls(request.imageUrl(), request.imageUrls()));
        if (request.categoryId() != null) {
            Category category = requireLeafActiveCategory(request.categoryId());
            costume.setCategory(category);
        }
        if (request.status() != null) {
            costume.setStatus(CostumeStatus.valueOf(request.status().toUpperCase()));
        }
        if (request.metadata() != null) {
            costumeMetadataService.upsertMetadata(costume, request.metadata());
        }

        return AdminCostumeDTO.fromEntity(costumeRepository.save(costume));
    }

    @Override
    public PaginatedResponse<CatalogCostumeDTO> getAllActiveCostumes(Long categoryId, String categoryPath, String keyword,
                                                              int pageNo, int pageSize,
                                                              String sortBy, String sortDir, Long userId) {
        // Build Sort object from parameters
        String resolvedSortBy = resolveSortField(sortBy);
        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(resolvedSortBy).descending()
                : Sort.by(resolvedSortBy).ascending();

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

        Map<Long, ActiveEventOffer> offersByCostumeId = loadActiveEventOffers(page.getContent());
        return PaginatedResponse.from(page, costume -> toCatalogCostumeDTO(
                costume,
                offersByCostumeId.get(costume.getId())
        ));
    }

    @Override
    public CostumeDTO getCostumeById(Long id, Long userId) {
        Costume costume = costumeRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", id));
                
        List<InventorySummaryDTO> inventorySummary = inventoryRepository.getPooledInventorySummaryByCostumeId(id);

        if (userId != null) {
            Cart cart = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE).orElse(null);
            if (cart != null) {
                inventorySummary = inventorySummary.stream().map(s -> {
                    long inCart = cartItemRepository.countVariantInCart(cart.getId(), s.costumeId(), s.size(), s.color());
                    return new InventorySummaryDTO(s.costumeId(), s.color(), s.size(), s.availableCount(), inCart);
                }).toList();
            }
        }

        ActiveEventOffer activeOffer = eventPricingService.findActiveOffers(
                List.of(costume.getId()),
                LocalDateTime.now()
        ).get(costume.getId());

        return activeOffer == null
                ? CostumeDTO.fromEntity(costume, inventorySummary)
                : CostumeDTO.fromEntity(
                        costume,
                        inventorySummary,
                        activeOffer.discountPercent(),
                        activeOffer.finalPrice(),
                        activeOffer.eventName()
                );
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

    private Map<Long, ActiveEventOffer> loadActiveEventOffers(List<Costume> costumes) {
        if (costumes == null || costumes.isEmpty()) {
            return Map.of();
        }
        return eventPricingService.findActiveOffers(
                costumes.stream().map(Costume::getId).toList(),
                LocalDateTime.now()
        );
    }

    private CatalogCostumeDTO toCatalogCostumeDTO(Costume costume, ActiveEventOffer activeOffer) {
        if (activeOffer == null) {
            return CatalogCostumeDTO.fromEntity(costume);
        }
        return CatalogCostumeDTO.fromEntity(
                costume,
                activeOffer.discountPercent(),
                activeOffer.finalPrice(),
                activeOffer.eventName()
        );
    }

    private String resolveSortField(String sortBy) {
        if (sortBy == null) {
            return "id";
        }

        String candidate = sortBy.trim();
        return ALLOWED_SORT_FIELDS.contains(candidate) ? candidate : "id";
    }

    private User requireProductManager(String authenticatedEmail) {
        User actor = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authenticatedEmail));

        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new AccessDeniedException("Only admin or staff accounts can manage costumes.");
        }

        return actor;
    }

    private List<String> resolveImageUrls(String imageUrl, List<String> imageUrls) {
        if (imageUrls != null && !imageUrls.isEmpty()) return imageUrls;
        if (imageUrl != null && !imageUrl.isBlank()) return List.of(imageUrl);
        return List.of();
    }

    private void applyCostumeImages(Costume costume, List<String> imageUrls) {
        costume.getImages().clear();
        for (int i = 0; i < imageUrls.size(); i++) {
            costume.getImages().add(CostumeImage.builder()
                    .costume(costume)
                    .imageUrl(imageUrls.get(i))
                    .displayOrder(i)
                    .primary(i == 0)
                    .build());
        }
    }

    private Category requireLeafActiveCategory(Long categoryId) {
        Category category = categoryRepository.findByIdAndIsActiveTrue(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục đang hoạt động với id: " + categoryId));

        if (!categoryRepository.findByParentIdAndIsActiveTrueOrderBySortOrderAsc(categoryId).isEmpty()) {
            throw new BadRequestException("Chỉ có thể gắn trang phục vào danh mục cấp cuối.");
        }

        return category;
    }

    private String generateSlug(String name) {
        if (name == null || name.isBlank()) return "";
        return java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("đ", "d").replaceAll("Đ", "D")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }

    private Map<Long, Integer> getAvailableCountsByCostumeId(List<Costume> costumes) {
        if (costumes == null || costumes.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Long> costumeIds = costumes.stream()
                .map(Costume::getId)
                .toList();

        Map<Long, Integer> counts = new HashMap<>();
        inventoryRepository.getPooledItemCountsByCostumeIds(costumeIds)
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
