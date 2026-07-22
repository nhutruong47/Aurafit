package com.aurafit.service.impl;

import com.aurafit.dto.response.CatalogCostumeDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.Event;
import com.aurafit.entity.EventCostume;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.EventStatus;
import com.aurafit.repository.CartItemRepository;
import com.aurafit.repository.CartRepository;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.EventCostumeRepository;
import com.aurafit.repository.InventoryRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.CostumeMetadataService;
import com.aurafit.service.EventPricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CostumeServiceImplDiscountTest {

    @Mock private CostumeRepository costumeRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private CostumeMetadataService costumeMetadataService;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private EventCostumeRepository eventCostumeRepository;

    private CostumeServiceImpl costumeService;

    @BeforeEach
    void setUp() {
        EventPricingService eventPricingService = new EventPricingServiceImpl(eventCostumeRepository);
        costumeService = new CostumeServiceImpl(
                costumeRepository,
                categoryRepository,
                userRepository,
                costumeMetadataService,
                inventoryRepository,
                cartRepository,
                cartItemRepository,
                eventPricingService
        );
    }

    @Test
    void getAllActiveCostumes_shouldApplyActiveDiscountWithOneBatchLookup() {
        Costume discountedCostume = costume(1L, "Áo dài sự kiện", "1000000");
        Costume regularCostume = costume(2L, "Áo dài thường", "800000");
        Pageable pageable = PageRequest.of(0, 12);
        when(costumeRepository.findAllWithFilters(
                eq(CostumeStatus.ACTIVE),
                isNull(),
                eq(""),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(discountedCostume, regularCostume), pageable, 2));
        when(eventCostumeRepository.findActiveEventsForCostumeIds(
                eq(List.of(1L, 2L)),
                any(LocalDateTime.class)
        )).thenReturn(List.of(activeAssignment(discountedCostume, "20")));

        PaginatedResponse<CatalogCostumeDTO> response = costumeService.getAllActiveCostumes(
                null, null, null, 0, 12, "id", "asc", null
        );

        CatalogCostumeDTO discounted = response.content().get(0);
        CatalogCostumeDTO regular = response.content().get(1);
        assertEquals(new BigDecimal("20"), discounted.discountPercent());
        assertEquals(new BigDecimal("800000"), discounted.finalPrice());
        assertEquals("Ưu đãi đang diễn ra", discounted.eventName());
        assertNull(regular.discountPercent());
        assertNull(regular.finalPrice());
        assertNull(regular.eventName());
        verify(eventCostumeRepository, times(1)).findActiveEventsForCostumeIds(
                eq(List.of(1L, 2L)),
                any(LocalDateTime.class)
        );
    }

    @Test
    void getCostumeById_shouldApplyActiveEventDiscount() {
        Costume costume = costume(3L, "Váy dạ hội", "999999");
        stubDetail(costume, List.of(activeAssignment(costume, "15")));

        CostumeDTO response = costumeService.getCostumeById(costume.getId(), null);

        assertEquals(new BigDecimal("15"), response.discountPercent());
        assertEquals(new BigDecimal("849999"), response.finalPrice());
        assertEquals("Ưu đãi đang diễn ra", response.eventName());
    }

    @Test
    void getCostumeById_shouldIgnoreEventThatHasNotStarted() {
        Costume costume = costume(4L, "Trang phục tương lai", "500000");
        stubDetail(costume, List.of(assignment(
                costume,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(5),
                "10"
        )));

        CostumeDTO response = costumeService.getCostumeById(costume.getId(), null);

        assertNoDiscount(response);
    }

    @Test
    void getCostumeById_shouldIgnoreExpiredEvent() {
        Costume costume = costume(5L, "Trang phục hết ưu đãi", "500000");
        stubDetail(costume, List.of(assignment(
                costume,
                LocalDateTime.now().minusDays(5),
                LocalDateTime.now().minusDays(1),
                "10"
        )));

        CostumeDTO response = costumeService.getCostumeById(costume.getId(), null);

        assertNoDiscount(response);
    }

    @Test
    void getCostumeById_shouldKeepDiscountFieldsNullWithoutEvent() {
        Costume costume = costume(6L, "Trang phục không sự kiện", "500000");
        stubDetail(costume, List.of());

        CostumeDTO response = costumeService.getCostumeById(costume.getId(), null);

        assertNoDiscount(response);
    }

    private void stubDetail(Costume costume, List<EventCostume> assignments) {
        when(costumeRepository.findByIdWithItems(costume.getId())).thenReturn(Optional.of(costume));
        when(inventoryRepository.getPooledInventorySummaryByCostumeId(costume.getId())).thenReturn(List.of());
        when(eventCostumeRepository.findActiveEventsForCostumeIds(
                eq(List.of(costume.getId())),
                any(LocalDateTime.class)
        )).thenReturn(assignments);
    }

    private void assertNoDiscount(CostumeDTO response) {
        assertNull(response.discountPercent());
        assertNull(response.finalPrice());
        assertNull(response.eventName());
    }

    private EventCostume activeAssignment(Costume costume, String discountPercent) {
        return assignment(
                costume,
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(1),
                discountPercent
        );
    }

    private EventCostume assignment(
            Costume costume,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String discountPercent
    ) {
        Event event = Event.builder()
                .id(11L)
                .name("Ưu đãi đang diễn ra")
                .discountPercent(new BigDecimal(discountPercent))
                .startDate(startDate)
                .endDate(endDate)
                .status(EventStatus.ACTIVE)
                .build();
        return EventCostume.builder()
                .id(21L)
                .event(event)
                .costume(costume)
                .build();
    }

    private Costume costume(Long id, String name, String rentalPrice) {
        Category category = Category.builder()
                .id(7L)
                .name("Sự kiện")
                .slug("su-kien")
                .path("su-kien")
                .build();
        return Costume.builder()
                .id(id)
                .name(name)
                .slug("costume-" + id)
                .rentalPrice(new BigDecimal(rentalPrice))
                .depositPrice(new BigDecimal("200000"))
                .status(CostumeStatus.ACTIVE)
                .category(category)
                .availableItemCount(1)
                .build();
    }
}
