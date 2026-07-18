package com.aurafit.service.impl;

import com.aurafit.enums.CostumeStatus;
import com.aurafit.repository.CartItemRepository;
import com.aurafit.repository.CartRepository;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.InventoryRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.CostumeMetadataService;
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
                cartItemRepository
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
