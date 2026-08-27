package com.aurafit.config;

import com.aurafit.business.catalog.entity.Category;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeItem;
import com.aurafit.business.catalog.entity.CostumeMetadata;
import com.aurafit.business.catalog.enums.CostumeStatus;
import com.aurafit.business.catalog.enums.ItemStatus;
import com.aurafit.business.catalog.repository.CategoryRepository;
import com.aurafit.business.catalog.repository.CostumeItemRepository;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Profile({"dev", "seed"})
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class CostumeDataSeeder implements org.springframework.boot.CommandLineRunner {

    static final String SEED_RESOURCE = "seed/costumes-50.json";

    private final CategoryRepository categoryRepository;
    private final CostumeRepository costumeRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("[COSTUME-SEED] Seeder activated; loading resource={}", SEED_RESOURCE);
        List<SeedProduct> seeds = loadSeeds();
        validateSeeds(seeds);

        Set<String> existingSlugs = costumeRepository.findAll().stream()
                .filter(costume -> StringUtils.hasText(costume.getSlug()))
                .map(Costume::getSlug)
                .collect(Collectors.toSet());
        Map<String, Category> categoryCache = new HashMap<>();
        int createdCount = 0;
        int skippedCount = 0;
        int itemCount = 0;

        long existingSeedCount = seeds.stream()
                .map(SeedProduct::slug)
                .filter(existingSlugs::contains)
                .count();
        log.info(
                "[COSTUME-SEED] Check started resource={} expectedProducts={} existingSeedProducts={} missingSeedProducts={}",
                SEED_RESOURCE,
                seeds.size(),
                existingSeedCount,
                seeds.size() - existingSeedCount
        );

        for (SeedProduct seed : seeds) {
            Costume costume = costumeRepository.findBySlug(seed.slug()).orElse(new Costume());
            Category category = categoryCache.computeIfAbsent(seed.categoryPath(), this::requireLeafCategory);
            applyProduct(costume, category, seed);
            Costume savedCostume = costumeRepository.save(costume);
            int createdItems = upsertItems(savedCostume, seed.variants());
            itemCount += createdItems;
            createdCount++;
            existingSlugs.add(seed.slug());
            log.info(
                    "[COSTUME-SEED] Product created position={}/{} costumeId={} slug={} inventoryItems={}",
                    createdCount,
                    seeds.size() - existingSeedCount,
                    savedCostume.getId(),
                    savedCostume.getSlug(),
                    createdItems
            );
        }

        log.info(
                "[COSTUME-SEED] Completed successfully expectedProducts={} created={} skippedExisting={} "
                        + "inventoryItemsCreated={} imagesCreated=0",
                seeds.size(),
                createdCount,
                skippedCount,
                itemCount
        );
        if (createdCount == 0) {
            log.info("[COSTUME-SEED] No insert required; all {} seed products already exist.", seeds.size());
        }
    }

    List<SeedProduct> loadSeeds() {
        ClassPathResource resource = new ClassPathResource(SEED_RESOURCE);
        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, new TypeReference<>() {
            });
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot read costume seed resource: " + SEED_RESOURCE, exception);
        }
    }

    void validateSeeds(List<SeedProduct> seeds) {
        if (seeds == null || seeds.isEmpty()) {
            throw new IllegalStateException("Costume seed must not be empty.");
        }

        Set<String> slugs = new HashSet<>();
        Set<String> skus = new HashSet<>();
        for (SeedProduct seed : seeds) {
            requireText(seed.name(), "name");
            requireText(seed.slug(), "slug");
            requireText(seed.description(), "description");
            requireText(seed.categoryPath(), "categoryPath");
            requireText(seed.style(), "style");
            requireText(seed.occasion(), "occasion");
            requireText(seed.season(), "season");
            requireText(seed.color(), "color");
            requireText(seed.skinTone(), "skinTone");
            requireText(seed.bodyType(), "bodyType");
            requireText(seed.gender(), "gender");
            requireText(seed.size(), "size");
            requireText(seed.material(), "material");
            requireText(seed.fitNote(), "fitNote");
            requirePositive(seed.rentalPrice(), "rentalPrice", seed.slug());
            requirePositive(seed.depositPrice(), "depositPrice", seed.slug());
            if (!slugs.add(seed.slug())) {
                throw new IllegalStateException("Duplicate costume seed slug: " + seed.slug());
            }
            if (seed.tags() == null || seed.tags().isEmpty() || seed.tags().stream().anyMatch(tag -> !StringUtils.hasText(tag))) {
                throw new IllegalStateException("Seed tags are required for: " + seed.slug());
            }
            if (seed.variants() == null || seed.variants().isEmpty()) {
                throw new IllegalStateException("At least one inventory variant is required for: " + seed.slug());
            }
            for (SeedVariant variant : seed.variants()) {
                requireText(variant.sku(), "variant.sku");
                requireText(variant.size(), "variant.size");
                requireText(variant.color(), "variant.color");
                if (!skus.add(variant.sku())) {
                    throw new IllegalStateException("Duplicate costume seed SKU: " + variant.sku());
                }
            }
        }
    }

    private Category requireLeafCategory(String categoryPath) {
        Category category = categoryRepository.findByPathAndIsActiveTrue(categoryPath)
                .orElseThrow(() -> new IllegalStateException(
                        "Active category not found for costume seed path: " + categoryPath
                ));
        boolean hasActiveChildren = category.getChildren() != null && category.getChildren().stream()
                .anyMatch(child -> Boolean.TRUE.equals(child.getIsActive()));
        if (hasActiveChildren) {
            throw new IllegalStateException("Costume seed category must be a leaf: " + categoryPath);
        }
        return category;
    }

    private void applyProduct(Costume costume, Category category, SeedProduct seed) {
        costume.setName(seed.name());
        costume.setSlug(seed.slug());
        costume.setDescription(seed.description());
        costume.setRentalPrice(seed.rentalPrice());
        costume.setDepositPrice(seed.depositPrice());
        costume.setStatus(CostumeStatus.ACTIVE);
        costume.setCategory(category);
        
        // Use unique images per product using loremflickr with a lock so they don't change on every reload
        String lowerCategory = seed.categoryPath().toLowerCase();
        int lockId = Math.abs(seed.slug().hashCode()) % 10000;
        
        if (lowerCategory.contains("vest") || lowerCategory.contains("tuxedo")) {
            costume.setImageUrl("https://loremflickr.com/800/1000/suit,menswear?lock=" + lockId);
        } else if (lowerCategory.contains("da-hoi") || lowerCategory.contains("vay") || lowerCategory.contains("dam")) {
            costume.setImageUrl("https://loremflickr.com/800/1000/dress,gown?lock=" + lockId);
        } else if (lowerCategory.contains("truyen-thong") || lowerCategory.contains("ao-dai") || lowerCategory.contains("hanbok") || lowerCategory.contains("kimono")) {
            costume.setImageUrl("https://loremflickr.com/800/1000/traditional,clothing?lock=" + lockId);
        } else if (lowerCategory.contains("cosplay") || lowerCategory.contains("anime") || lowerCategory.contains("game")) {
            costume.setImageUrl("https://loremflickr.com/800/1000/cosplay,costume?lock=" + lockId);
        } else if (lowerCategory.contains("phu-kien")) {
            costume.setImageUrl("https://loremflickr.com/800/1000/accessory,jewelry?lock=" + lockId);
        } else {
            costume.setImageUrl("https://loremflickr.com/800/1000/fashion,outfit?lock=" + lockId);
        }

        CostumeMetadata metadata = costume.getMetadata();
        if (metadata == null) {
            metadata = new CostumeMetadata();
            metadata.setCostume(costume);
            costume.setMetadata(metadata);
        }
        metadata.setStyle(seed.style());
        metadata.setOccasion(seed.occasion());
        metadata.setSeason(seed.season());
        metadata.setColor(seed.color());
        metadata.setTags(new ArrayList<>(seed.tags()));
        metadata.setSkinTone(seed.skinTone());
        metadata.setBodyType(seed.bodyType());
        metadata.setGender(seed.gender());
        metadata.setSize(seed.size());
        metadata.setMaterial(seed.material());
        metadata.setFitNote(seed.fitNote());
    }

    private int upsertItems(Costume costume, List<SeedVariant> variants) {
        Map<String, CostumeItem> existingItemsBySku = costumeItemRepository.findByCostumeId(costume.getId()).stream()
                .collect(Collectors.toMap(CostumeItem::getSku, Function.identity(), (left, right) -> left));
        for (SeedVariant variant : variants) {
            CostumeItem item = existingItemsBySku.getOrDefault(variant.sku(), new CostumeItem());
            item.setCostume(costume);
            item.setSku(variant.sku());
            item.setSize(variant.size());
            item.setColor(variant.color());
            if (item.getStatus() == null) {
                item.setStatus(ItemStatus.AVAILABLE);
            }
            costumeItemRepository.save(item);
        }
        return variants.size();
    }

    private void requireText(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Costume seed field is required: " + fieldName);
        }
    }

    private void requirePositive(BigDecimal value, String fieldName, String slug) {
        if (value == null || value.signum() <= 0) {
            throw new IllegalStateException(fieldName + " must be positive for costume seed: " + slug);
        }
    }

    record SeedProduct(
            String name,
            String slug,
            String description,
            BigDecimal rentalPrice,
            BigDecimal depositPrice,
            String categoryPath,
            String style,
            String occasion,
            String season,
            String color,
            List<String> tags,
            String skinTone,
            String bodyType,
            String gender,
            String size,
            String material,
            String fitNote,
            List<SeedVariant> variants
    ) {
    }

    record SeedVariant(String sku, String size, String color) {
    }
}
