package com.aurafit.config;

import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.CostumeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CostumeDataSeederTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CostumeRepository costumeRepository;

    @Mock
    private CostumeItemRepository costumeItemRepository;

    @Test
    void seedResource_shouldContainExactlyFiftyValidProductsAndUniqueInventory() {
        CostumeDataSeeder seeder = seeder();

        List<CostumeDataSeeder.SeedProduct> seeds = seeder.loadSeeds();
        seeder.validateSeeds(seeds);

        assertEquals(50, seeds.size());
        assertEquals(50, seeds.stream().map(CostumeDataSeeder.SeedProduct::slug).distinct().count());
        assertTrue(seeds.stream().allMatch(seed -> DataInitializer.isSeedLeafCategoryPath(seed.categoryPath())));
        assertEquals(100, seeds.stream().mapToInt(seed -> seed.variants().size()).sum());
        assertEquals(
                100,
                seeds.stream()
                        .flatMap(seed -> seed.variants().stream())
                        .map(CostumeDataSeeder.SeedVariant::sku)
                        .distinct()
                        .count()
        );
    }

    @Test
    void run_shouldCreateFiftyActiveCostumesWithMetadataInventoryAndNoImages() {
        Category leafCategory = Category.builder()
                .id(1L)
                .name("Leaf")
                .slug("leaf")
                .path("leaf")
                .isActive(true)
                .children(new ArrayList<>())
                .build();
        when(categoryRepository.findByPathAndIsActiveTrue(anyString())).thenReturn(Optional.of(leafCategory));
        when(costumeRepository.findAll()).thenReturn(List.of());
        AtomicLong costumeIds = new AtomicLong(1L);
        when(costumeRepository.save(any(Costume.class))).thenAnswer(invocation -> {
            Costume costume = invocation.getArgument(0);
            costume.setId(costumeIds.getAndIncrement());
            return costume;
        });
        when(costumeItemRepository.findByCostumeId(anyLong())).thenReturn(List.of());
        when(costumeItemRepository.save(any(CostumeItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        CostumeDataSeeder seeder = seeder();

        seeder.run();

        ArgumentCaptor<Costume> costumes = ArgumentCaptor.forClass(Costume.class);
        verify(costumeRepository, times(50)).save(costumes.capture());
        verify(costumeItemRepository, times(100)).save(any(CostumeItem.class));

        Set<String> slugs = new HashSet<>();
        for (Costume costume : costumes.getAllValues()) {
            assertTrue(slugs.add(costume.getSlug()));
            assertEquals(CostumeStatus.ACTIVE, costume.getStatus());
            assertNull(costume.getImageUrl());
            assertNotNull(costume.getImages());
            assertTrue(costume.getImages().isEmpty());
            assertNotNull(costume.getMetadata());
            assertTrue(costume.getMetadata().getTags().size() >= 4);
            assertNotNull(costume.getMetadata().getMaterial());
            assertNotNull(costume.getMetadata().getFitNote());
        }

        ArgumentCaptor<CostumeItem> items = ArgumentCaptor.forClass(CostumeItem.class);
        verify(costumeItemRepository, times(100)).save(items.capture());
        assertEquals(100, items.getAllValues().stream().map(CostumeItem::getSku).distinct().count());
        assertTrue(items.getAllValues().stream().allMatch(item -> item.getStatus() == ItemStatus.AVAILABLE));
    }

    @Test
    void run_shouldSkipAllExistingSeedProductsOnBackendRestart() {
        CostumeDataSeeder seeder = seeder();
        List<Costume> existingSeeds = seeder.loadSeeds().stream()
                .map(seed -> Costume.builder().id(1L).slug(seed.slug()).build())
                .toList();
        when(costumeRepository.findAll()).thenReturn(existingSeeds);

        seeder.run();

        verify(costumeRepository, never()).save(any(Costume.class));
        verify(costumeItemRepository, never()).save(any(CostumeItem.class));
        verify(categoryRepository, never()).findByPathAndIsActiveTrue(anyString());
    }

    private CostumeDataSeeder seeder() {
        return new CostumeDataSeeder(
                categoryRepository,
                costumeRepository,
                costumeItemRepository,
                new ObjectMapper().findAndRegisterModules()
        );
    }
}
