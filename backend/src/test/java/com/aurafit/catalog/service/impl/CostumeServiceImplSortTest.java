package com.aurafit.catalog.service.impl;

import com.aurafit.business.catalog.enums.CostumeStatus;
import com.aurafit.business.cart.repository.CartItemRepository;
import com.aurafit.business.cart.repository.CartRepository;
import com.aurafit.business.catalog.repository.CategoryRepository;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.business.catalog.repository.InventoryRepository;
import com.aurafit.business.catalog.service.impl.CostumeServiceImpl;
import com.aurafit.business.user.repository.UserRepository;
import com.aurafit.business.catalog.service.CostumeMetadataService;
import com.aurafit.business.catalog.service.EventPricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CostumeServiceImplSortTest {

    @Mock
    private CostumeRepository costumeRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CostumeMetadataService costumeMetadataService;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private EventPricingService eventPricingService;

    private CostumeServiceImpl costumeService;

    @BeforeEach
    void setUp() {
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
    void getAllActiveCostumes_shouldFallbackToIdForInvalidSortField() {
        when(costumeRepository.findAllWithFilters(
                eq(CostumeStatus.ACTIVE),
                isNull(),
                eq(""),
                any(Pageable.class)
        )).thenReturn(Page.empty());

        costumeService.getAllActiveCostumes(
                null,
                null,
                null,
                0,
                12,
                "notARealField",
                "desc",
                null
        );

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(costumeRepository).findAllWithFilters(
                eq(CostumeStatus.ACTIVE),
                isNull(),
                eq(""),
                pageableCaptor.capture()
        );

        assertEquals("id", pageableCaptor.getValue().getSort().iterator().next().getProperty());
    }
}
