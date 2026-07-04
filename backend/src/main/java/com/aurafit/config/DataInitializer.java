package com.aurafit.config;

import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.User;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.Role;
import com.aurafit.enums.UserStatus;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.CostumeMetadataRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Profile({"dev", "seed"})
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String DEV_SELLER_EMAIL = "seller@aurafit.local";
    private static final String DEV_SELLER_PASSWORD = "Seller@123";
    private static final String LEGACY_TRADITIONAL_ROOT_PREFIX = "ky-yeu/trang-phuc-truyen-thong/";

    private static final ItemStatus[] EXTRA_ITEM_STATUS_CYCLE = {
            ItemStatus.AVAILABLE,
            ItemStatus.RENTED,
            ItemStatus.AVAILABLE,
            ItemStatus.MAINTENANCE,
            ItemStatus.AVAILABLE,
            ItemStatus.RENTED,
            ItemStatus.AVAILABLE,
            ItemStatus.AVAILABLE,
            ItemStatus.RENTED,
            ItemStatus.MAINTENANCE,
            ItemStatus.AVAILABLE,
            ItemStatus.LOST
    };

    private static final List<CategoryTreeSeed> CATEGORY_TREE_SEEDS = buildCategoryTreeSeeds();
    private static final Map<String, CategoryTreeSeedEntry> CATEGORY_TREE_SEEDS_BY_PATH = indexCategoryTreeSeeds(CATEGORY_TREE_SEEDS, null);
    private static final Map<String, String> CATALOG_CATEGORY_PATH_BY_SEED_NAME = buildCatalogCategoryPathBySeedName();
    private static final List<CategorySeed> CATEGORY_SEEDS = buildCategorySeeds();

    private final CategoryRepository categoryRepository;
    private final CostumeRepository costumeRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final CostumeMetadataRepository costumeMetadataRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedCatalog();
    }

    private void seedCatalog() {
        log.info("Starting DEV catalog seed sync.");

        User catalogOwner = resolveCatalogOwner();

        Map<String, Category> categoriesByPath = categoryRepository.findAll().stream()
                .filter(category -> category.getPath() != null && !category.getPath().isBlank())
                .collect(Collectors.toMap(
                        Category::getPath,
                        category -> category,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        int seededCategoryCount = syncCategoryTree(CATEGORY_TREE_SEEDS, null, categoriesByPath);
        int deactivatedCategoryCount = deactivateStaleCategories(categoriesByPath);
        ensureCatalogCategoryPathsExist(categoriesByPath);
        int migratedLegacyTraditionalCostumeCount = migrateLegacyTraditionalCostumeCategories(categoriesByPath);

        Map<String, Costume> costumesByKey = costumeRepository.findAllWithItems().stream()
                .collect(Collectors.toMap(
                        costume -> costumeKey(costume.getCategory() != null ? costume.getCategory().getPath() : null, costume.getName()),
                        costume -> costume,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, CostumeItem> itemsBySku = costumeItemRepository.findAll().stream()
                .collect(Collectors.toMap(
                        CostumeItem::getSku,
                        item -> item,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        int globalCostumeIndex = 0;
        int extraItemCursor = 0;

        for (CategorySeed categorySeed : CATEGORY_SEEDS) {
            Category category = resolveCatalogCategory(categorySeed, categoriesByPath);

            for (int categoryCostumeIndex = 0; categoryCostumeIndex < categorySeed.costumes().size(); categoryCostumeIndex++) {
                CostumeSeed costumeSeed = categorySeed.costumes().get(categoryCostumeIndex);
                Costume costume = upsertCostume(categorySeed, category, costumeSeed, categoryCostumeIndex, globalCostumeIndex, catalogOwner, costumesByKey);
                upsertMetadata(categorySeed, costumeSeed, costume, categoryCostumeIndex);
                extraItemCursor = upsertItems(categorySeed, costumeSeed, costume, categoryCostumeIndex, globalCostumeIndex, extraItemCursor, itemsBySku);
                globalCostumeIndex++;
            }
        }

        int autoCompletedLeafCategoryCount = ensureLeafCategoryCoverage(
                categoriesByPath,
                costumesByKey,
                itemsBySku,
                catalogOwner,
                globalCostumeIndex,
                extraItemCursor
        );

        log.info("DEV catalog seed synced: {} categories, {} stale categories deactivated, {} legacy traditional costumes migrated, {} costumes, {} costume items, {} leaf categories auto-completed.",
                seededCategoryCount,
                deactivatedCategoryCount,
                migratedLegacyTraditionalCostumeCount,
                costumesByKey.size(),
                itemsBySku.size(),
                autoCompletedLeafCategoryCount);
    }

    private int syncCategoryTree(List<CategoryTreeSeed> seeds, Category parent, Map<String, Category> categoriesByPath) {
        int count = 0;

        for (int index = 0; index < seeds.size(); index++) {
            CategoryTreeSeed seed = seeds.get(index);
            String slug = slugify(seed.name());
            String path = parent == null ? slug : parent.getPath() + "/" + slug;

            Category category = categoriesByPath.get(path);
            if (category == null) {
                category = new Category();
            }

            category.setName(seed.name());
            category.setSlug(slug);
            category.setPath(path);
            category.setDescription(seed.description());
            category.setParent(parent);
            category.setSortOrder(index);
            category.setIsActive(true);

            Category savedCategory = categoryRepository.save(category);
            categoriesByPath.put(savedCategory.getPath(), savedCategory);

            count++;
            count += syncCategoryTree(seed.children(), savedCategory, categoriesByPath);
        }

        return count;
    }

    private int deactivateStaleCategories(Map<String, Category> categoriesByPath) {
        int count = 0;

        for (Category category : categoriesByPath.values()) {
            String path = category.getPath();
            if (path == null || path.isBlank() || CATEGORY_TREE_SEEDS_BY_PATH.containsKey(path)) {
                continue;
            }

            if (Boolean.FALSE.equals(category.getIsActive())) {
                continue;
            }

            category.setIsActive(false);
            categoryRepository.save(category);
            count++;
        }

        return count;
    }

    private int migrateLegacyTraditionalCostumeCategories(Map<String, Category> categoriesByPath) {
        List<Costume> costumes = costumeRepository.findAllWithItems();
        LinkedHashSet<String> occupiedKeys = costumes.stream()
                .map(costume -> costumeKey(costume.getCategory() != null ? costume.getCategory().getPath() : null, costume.getName()))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        int migratedCount = 0;

        for (Costume costume : costumes) {
            Category currentCategory = costume.getCategory();
            String currentPath = currentCategory != null ? currentCategory.getPath() : null;
            if (currentPath == null || !currentPath.startsWith(LEGACY_TRADITIONAL_ROOT_PREFIX)) {
                continue;
            }

            String targetPath = currentPath.substring("ky-yeu/".length());
            Category targetCategory = categoriesByPath.get(targetPath);
            if (targetCategory == null) {
                continue;
            }

            String targetKey = costumeKey(targetPath, costume.getName());
            String currentKey = costumeKey(currentPath, costume.getName());
            if (occupiedKeys.contains(targetKey) && !currentKey.equals(targetKey)) {
                continue;
            }

            costume.setCategory(targetCategory);
            costumeRepository.save(costume);

            occupiedKeys.remove(currentKey);
            occupiedKeys.add(targetKey);
            migratedCount++;
        }

        return migratedCount;
    }

    private void ensureCatalogCategoryPathsExist(Map<String, Category> categoriesByPath) {
        for (String categoryPath : new LinkedHashSet<>(CATALOG_CATEGORY_PATH_BY_SEED_NAME.values())) {
            ensureCategoryPathExists(categoryPath, categoriesByPath);
        }
    }

    private Category ensureCategoryPathExists(String categoryPath, Map<String, Category> categoriesByPath) {
        Category existingCategory = categoriesByPath.get(categoryPath);
        if (existingCategory != null) {
            return existingCategory;
        }

        CategoryTreeSeedEntry seedEntry = CATEGORY_TREE_SEEDS_BY_PATH.get(categoryPath);
        if (seedEntry == null) {
            throw new IllegalStateException("Chưa cấu hình category seed cho path: " + categoryPath);
        }

        String parentPath = extractParentPath(categoryPath);
        Category parent = parentPath == null ? null : ensureCategoryPathExists(parentPath, categoriesByPath);

        Category category = new Category();
        category.setName(seedEntry.name());
        category.setSlug(seedEntry.slug());
        category.setPath(categoryPath);
        category.setDescription(seedEntry.description());
        category.setParent(parent);
        category.setSortOrder(seedEntry.sortOrder());
        category.setIsActive(true);

        Category savedCategory = categoryRepository.save(category);
        categoriesByPath.put(savedCategory.getPath(), savedCategory);
        return savedCategory;
    }

    private Category resolveCatalogCategory(CategorySeed seed, Map<String, Category> categoriesByPath) {
        String categoryPath = CATALOG_CATEGORY_PATH_BY_SEED_NAME.get(seed.name());
        if (categoryPath == null) {
            throw new IllegalStateException("Chưa cấu hình category path cho catalog seed: " + seed.name());
        }

        ensureCategoryPathExists(categoryPath, categoriesByPath);
        Category category = categoriesByPath.get(categoryPath);
        if (category == null) {
            throw new IllegalStateException("Không tìm thấy category đã seed theo path: " + categoryPath);
        }

        return category;
    }

    private Costume upsertCostume(CategorySeed categorySeed,
                                  Category category,
                                  CostumeSeed costumeSeed,
                                  int categoryCostumeIndex,
                                  int globalCostumeIndex,
                                  User catalogOwner,
                                  Map<String, Costume> costumesByKey) {
        String key = costumeKey(category != null ? category.getPath() : null, costumeSeed.name());
        Costume costume = costumesByKey.get(key);
        if (costume == null) {
            costume = new Costume();
        }

        costume.setName(costumeSeed.name());
        costume.setDescription(buildDescription(categorySeed, costumeSeed, categoryCostumeIndex, globalCostumeIndex));
        costume.setRentalPrice(money(costumeSeed.rentalPrice()));
        costume.setDepositPrice(money(costumeSeed.depositPrice()));
        costume.setImageUrl(buildImageUrl(categorySeed, costumeSeed));
        costume.setStatus(CostumeStatus.ACTIVE);
        costume.setCategory(category);
        costume.setOwner(catalogOwner);

        Costume savedCostume = costumeRepository.save(costume);
        costumesByKey.put(key, savedCostume);
        return savedCostume;
    }

    private int ensureLeafCategoryCoverage(Map<String, Category> categoriesByPath,
                                           Map<String, Costume> costumesByKey,
                                           Map<String, CostumeItem> itemsBySku,
                                           User catalogOwner,
                                           int globalCostumeIndex,
                                           int extraItemCursor) {
        LinkedHashSet<String> parentPaths = CATEGORY_TREE_SEEDS_BY_PATH.keySet().stream()
                .map(DataInitializer::extractParentPath)
                .filter(parentPath -> parentPath != null && !parentPath.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<String> leafPaths = CATEGORY_TREE_SEEDS_BY_PATH.keySet().stream()
                .filter(path -> !parentPaths.contains(path))
                .sorted()
                .collect(Collectors.toList());

        LinkedHashSet<String> categoryPathsWithCostumes = costumesByKey.values().stream()
                .map(Costume::getCategory)
                .filter(category -> category != null && category.getPath() != null && !category.getPath().isBlank())
                .map(Category::getPath)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        int generatedLeafCategoryCount = 0;

        for (int leafIndex = 0; leafIndex < leafPaths.size(); leafIndex++) {
            String leafPath = leafPaths.get(leafIndex);
            if (categoryPathsWithCostumes.contains(leafPath)) {
                continue;
            }

            Category category = categoriesByPath.get(leafPath);
            if (category == null) {
                throw new IllegalStateException("Không tìm thấy category lá đã sync theo path: " + leafPath);
            }

            CategorySeed generatedCategorySeed = buildGeneratedLeafCategorySeed(category, leafIndex + 1);
            CostumeSeed generatedCostumeSeed = generatedCategorySeed.costumes().get(0);

            Costume costume = upsertCostume(
                    generatedCategorySeed,
                    category,
                    generatedCostumeSeed,
                    0,
                    globalCostumeIndex,
                    catalogOwner,
                    costumesByKey
            );
            upsertMetadata(generatedCategorySeed, generatedCostumeSeed, costume, 0);
            extraItemCursor = upsertItems(
                    generatedCategorySeed,
                    generatedCostumeSeed,
                    costume,
                    0,
                    globalCostumeIndex,
                    extraItemCursor,
                    itemsBySku
            );

            categoryPathsWithCostumes.add(leafPath);
            generatedLeafCategoryCount++;
            globalCostumeIndex++;
        }

        return generatedLeafCategoryCount;
    }

    private CategorySeed buildGeneratedLeafCategorySeed(Category category, int sequence) {
        String categoryPath = category.getPath();
        String rootSlug = extractRootSlug(categoryPath);
        String parentSlug = extractParentSlug(categoryPath);
        String leafName = category.getName();
        List<String> sizeOptions = resolveGeneratedSizeOptions(rootSlug, parentSlug);
        List<String> colorPalette = resolveGeneratedColorPalette(rootSlug, parentSlug);

        CostumeSeed generatedCostume = new CostumeSeed(
                resolveGeneratedCostumeName(rootSlug, parentSlug, leafName),
                colorPalette.get(0),
                resolveGeneratedMaterial(rootSlug, parentSlug),
                resolveGeneratedSilhouette(rootSlug, parentSlug),
                resolveGeneratedRentalPrice(rootSlug, parentSlug),
                resolveGeneratedDepositPrice(rootSlug, parentSlug),
                colorPalette,
                resolveGeneratedAccentTags(rootSlug, parentSlug, leafName),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                resolveGeneratedFitNote(rootSlug, parentSlug, leafName)
        );

        return new CategorySeed(
                String.format("LF%03d", sequence),
                leafName,
                category.getDescription(),
                resolveGeneratedStyle(rootSlug, parentSlug),
                resolveGeneratedOccasion(rootSlug, parentSlug, leafName),
                resolveGeneratedSeasons(rootSlug, parentSlug),
                resolveGeneratedGender(rootSlug, parentSlug, leafName),
                resolveGeneratedBodyType(rootSlug, parentSlug),
                "Da sáng đến ngăm",
                resolveGeneratedSizeLabel(rootSlug, parentSlug),
                sizeOptions,
                resolveGeneratedSharedTags(rootSlug, parentSlug, leafName),
                List.of(generatedCostume)
        );
    }

    private String resolveGeneratedCostumeName(String rootSlug, String parentSlug, String leafName) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "mascot" -> "Mascot " + leafName + " sự kiện";
                case "da-hoi" -> leafName + " cao cấp";
                case "le-hoi" -> "Trang phục " + leafName + " lễ hội";
                case "bieu-dien" -> "Trang phục " + leafName + " sân khấu";
                case "gan-ket-doi-nhom" -> leafName + " đội nhóm";
                default -> leafName + " sự kiện";
            };
            case "cosplay" -> switch (parentSlug) {
                case "tro-choi" -> "Cosplay " + leafName + " chiến đấu";
                case "gia-tuong" -> "Trang phục " + leafName + " giả tưởng";
                case "hoang-gia" -> "Cosplay " + leafName + " hoàng gia";
                case "phim-se-ri" -> "Trang phục " + leafName + " điện ảnh";
                default -> "Trang phục cosplay " + leafName;
            };
            case "trang-phuc-truyen-thong" -> switch (parentSlug) {
                case "nhat-ban" -> leafName + " truyền thống Nhật Bản";
                case "han-quoc" -> leafName + " truyền thống Hàn Quốc";
                case "viet-nam" -> leafName + " truyền thống Việt Nam";
                case "trung-quoc" -> leafName + " truyền thống Trung Quốc";
                case "au-my" -> leafName + " cổ điển Âu - Mỹ";
                default -> leafName + " truyền thống";
            };
            case "ky-yeu" -> switch (parentSlug) {
                case "concept-chup-anh" -> "Concept " + leafName + " kỷ yếu";
                case "cu-nhan" -> leafName + " tốt nghiệp";
                default -> leafName + " kỷ yếu";
            };
            case "phu-kien" -> switch (parentSlug) {
                case "toc-gia" -> "Tóc giả " + leafName + " tạo kiểu";
                case "giay" -> leafName + " thuê kèm";
                case "vu-khi-mo-hinh" -> leafName + " mô hình cosplay";
                case "trang-suc" -> leafName + " chụp concept";
                case "dao-cu-chup-anh" -> leafName + " chụp ảnh concept";
                case "trang-diem" -> "Gói " + leafName;
                default -> "Phụ kiện " + leafName;
            };
            default -> "Trang phục " + leafName;
        };
    }

    private String resolveGeneratedStyle(String rootSlug, String parentSlug) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "vest-trang-trong" -> "Trang trọng sự kiện";
                case "da-hoi" -> "Dạ hội nổi bật";
                case "le-hoi" -> "Lễ hội nhận diện cao";
                case "mascot" -> "Mascot hoạt náo";
                case "bieu-dien" -> "Sân khấu linh hoạt";
                case "gan-ket-doi-nhom" -> "Đồng bộ tập thể";
                default -> "Sự kiện chỉn chu";
            };
            case "cosplay" -> switch (parentSlug) {
                case "anime" -> "Nhân vật anime";
                case "tro-choi" -> "Game fantasy";
                case "gia-tuong" -> "Giả tưởng huyền ảo";
                case "hoang-gia" -> "Hoàng gia cổ điển";
                case "phim-se-ri" -> "Điện ảnh nhận diện cao";
                default -> "Cosplay nhân vật";
            };
            case "trang-phuc-truyen-thong" -> switch (parentSlug) {
                case "nhat-ban" -> "Truyền thống Nhật Bản";
                case "han-quoc" -> "Truyền thống Hàn Quốc";
                case "viet-nam" -> "Truyền thống Việt Nam";
                case "trung-quoc" -> "Truyền thống Trung Hoa";
                case "au-my" -> "Cổ điển Âu - Mỹ";
                default -> "Trang phục truyền thống";
            };
            case "ky-yeu" -> switch (parentSlug) {
                case "ao-dai" -> "Thanh lịch truyền thống";
                case "vest-tot-nghiep" -> "Trang trọng tốt nghiệp";
                case "cu-nhan" -> "Graduation tiêu chuẩn";
                case "dong-phuc-hoc-sinh" -> "Thanh xuân học đường";
                case "concept-chup-anh" -> "Concept chụp ảnh";
                default -> "Kỷ yếu chỉn chu";
            };
            case "phu-kien" -> switch (parentSlug) {
                case "toc-gia" -> "Tạo hình nhân vật";
                case "giay" -> "Hoàn thiện outfit";
                case "vu-khi-mo-hinh" -> "Đạo cụ nhân vật";
                case "trang-suc" -> "Điểm nhấn concept";
                case "dao-cu-chup-anh" -> "Phối cảnh chụp ảnh";
                case "trang-diem" -> "Makeup theo concept";
                default -> "Phụ kiện bổ trợ";
            };
            default -> "Catalog dev";
        };
    }

    private String resolveGeneratedOccasion(String rootSlug, String parentSlug, String leafName) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "da-hoi" -> "Dạ tiệc và prom";
                case "le-hoi" -> "Lễ hội và hoạt náo";
                case "mascot" -> "Activation thương hiệu";
                case "bieu-dien" -> "Biểu diễn sân khấu";
                case "gan-ket-doi-nhom" -> "Teambuilding và sự kiện nội bộ";
                default -> "Sự kiện trang trọng";
            };
            case "cosplay" -> switch (parentSlug) {
                case "tro-choi" -> "Cosplay game và offline cộng đồng";
                case "phim-se-ri" -> "Fan event và chụp concept";
                default -> "Cosplay và chụp concept";
            };
            case "trang-phuc-truyen-thong" -> switch (parentSlug) {
                case "nhat-ban", "han-quoc", "viet-nam", "trung-quoc", "au-my" -> "Lễ hội văn hóa và chụp concept";
                default -> "Trang phục truyền thống và chụp ảnh";
            };
            case "ky-yeu" -> switch (parentSlug) {
                case "cu-nhan" -> "Lễ tốt nghiệp";
                case "concept-chup-anh" -> "Chụp ảnh kỷ yếu";
                default -> "Kỷ yếu và chụp ảnh";
            };
            case "phu-kien" -> switch (parentSlug) {
                case "trang-diem" -> "Trang điểm theo lịch hẹn";
                case "dao-cu-chup-anh" -> "Chụp ảnh concept";
                default -> "Phụ kiện phối kèm";
            };
            default -> "Catalog " + leafName;
        };
    }

    private List<String> resolveGeneratedSeasons(String rootSlug, String parentSlug) {
        if ("su-kien".equals(rootSlug) && "da-hoi".equals(parentSlug)) {
            return list("Thu", "Đông");
        }
        if ("su-kien".equals(rootSlug) && "le-hoi".equals(parentSlug)) {
            return list("Thu", "Đông", "Quanh năm");
        }
        if ("trang-phuc-truyen-thong".equals(rootSlug)) {
            return list("Xuân", "Hè", "Thu");
        }
        if ("ky-yeu".equals(rootSlug)) {
            return list("Xuân", "Hè");
        }
        return list("Quanh năm");
    }

    private String resolveGeneratedGender(String rootSlug, String parentSlug, String leafName) {
        String leafSlug = slugify(leafName);
        if (leafSlug.contains("nam") || List.of("hoang-tu", "hiep-si").contains(leafSlug)) {
            return "Nam";
        }
        if (leafSlug.contains("nu")
                || List.of("dam-da-hoi", "dam-prom", "dam-cocktail", "ao-dai-trang", "ao-dai-truyen-thong",
                "ao-dai-cach-tan", "cong-chua", "hoang-hau", "tien-nu").contains(leafSlug)) {
            return "Nữ";
        }
        if ("phu-kien".equals(rootSlug) || "trang-diem".equals(parentSlug)) {
            return "Unisex";
        }
        return "Unisex";
    }

    private String resolveGeneratedBodyType(String rootSlug, String parentSlug) {
        if ("phu-kien".equals(rootSlug) || "mascot".equals(parentSlug)) {
            return "Phù hợp nhiều dáng người";
        }
        return "Dáng cân đối";
    }

    private String resolveGeneratedSizeLabel(String rootSlug, String parentSlug) {
        if ("phu-kien".equals(rootSlug) && "giay".equals(parentSlug)) {
            return "37-42";
        }
        if ("phu-kien".equals(rootSlug)) {
            return "Freesize";
        }
        if ("mascot".equals(parentSlug)) {
            return "M-XL";
        }
        return "S-XL";
    }

    private List<String> resolveGeneratedSizeOptions(String rootSlug, String parentSlug) {
        if ("phu-kien".equals(rootSlug) && "giay".equals(parentSlug)) {
            return list("37", "38", "39", "40", "41", "42");
        }
        if ("phu-kien".equals(rootSlug)) {
            return list("Freesize");
        }
        if ("mascot".equals(parentSlug)) {
            return list("M", "L", "XL");
        }
        return list("S", "M", "L", "XL");
    }

    private List<String> resolveGeneratedSharedTags(String rootSlug, String parentSlug, String leafName) {
        return list(rootSlug, parentSlug, slugify(leafName), "dev-seed");
    }

    private List<String> resolveGeneratedAccentTags(String rootSlug, String parentSlug, String leafName) {
        return list(slugify(leafName), parentSlug, rootSlug);
    }

    private List<String> resolveGeneratedColorPalette(String rootSlug, String parentSlug) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "vest-trang-trong" -> list("Đen", "Xanh navy");
                case "da-hoi" -> list("Đỏ rượu", "Champagne");
                case "le-hoi" -> list("Cam cháy", "Đen");
                case "mascot" -> list("Vàng mật", "Nâu");
                case "bieu-dien" -> list("Bạc ánh kim", "Đen");
                case "gan-ket-doi-nhom" -> list("Xanh dương", "Trắng");
                default -> list("Đen", "Trắng");
            };
            case "cosplay" -> switch (parentSlug) {
                case "anime" -> list("Cam sáng", "Đen");
                case "tro-choi" -> list("Xanh ngọc", "Đen");
                case "gia-tuong" -> list("Tím khói", "Bạc");
                case "hoang-gia" -> list("Đỏ đô", "Vàng");
                case "phim-se-ri" -> list("Xanh navy", "Xám khói");
                default -> list("Đen", "Đỏ");
            };
            case "trang-phuc-truyen-thong" -> switch (parentSlug) {
                case "nhat-ban" -> list("Đỏ son", "Kem");
                case "han-quoc" -> list("Hồng phấn", "Xanh ngọc");
                case "viet-nam" -> list("Trắng ngà", "Vàng kem");
                case "trung-quoc" -> list("Đỏ đô", "Vàng");
                case "au-my" -> list("Kem ngọc trai", "Xanh cổ vịt");
                default -> list("Đỏ đô", "Kem");
            };
            case "ky-yeu" -> switch (parentSlug) {
                case "ao-dai" -> list("Trắng ngà", "Kem");
                case "vest-tot-nghiep" -> list("Đen", "Xanh navy");
                case "cu-nhan" -> list("Đen", "Vàng");
                case "dong-phuc-hoc-sinh" -> list("Trắng", "Xanh than");
                case "concept-chup-anh" -> list("Be cát", "Nâu mocha");
                default -> list("Trắng", "Đen");
            };
            case "phu-kien" -> switch (parentSlug) {
                case "toc-gia" -> list("Nâu lạnh", "Đen");
                case "giay" -> list("Đen", "Nâu");
                case "vu-khi-mo-hinh" -> list("Bạc", "Đen");
                case "trang-suc" -> list("Vàng", "Bạc");
                case "dao-cu-chup-anh" -> list("Be", "Nâu");
                case "trang-diem" -> list("Hồng nude", "Nâu tây");
                default -> list("Đen", "Trắng");
            };
            default -> list("Đen", "Trắng");
        };
    }

    private String resolveGeneratedMaterial(String rootSlug, String parentSlug) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "vest-trang-trong" -> "tuytsi pha";
                case "da-hoi" -> "satin ánh nhẹ";
                case "le-hoi" -> "cotton phối thun";
                case "mascot" -> "nỉ lông mềm";
                case "bieu-dien" -> "thun co giãn";
                case "gan-ket-doi-nhom" -> "cotton lạnh";
                default -> "poly cao cấp";
            };
            case "cosplay" -> switch (parentSlug) {
                case "anime" -> "kaki pha cotton";
                case "tro-choi" -> "gabardine phối da";
                case "gia-tuong" -> "voan phối nhung";
                case "hoang-gia" -> "gấm ánh kim";
                case "phim-se-ri" -> "poly twill";
                default -> "poly dày";
            };
            case "trang-phuc-truyen-thong" -> switch (parentSlug) {
                case "nhat-ban" -> "lụa gân nhẹ";
                case "han-quoc" -> "lụa pha organza";
                case "viet-nam" -> "lụa matte";
                case "trung-quoc" -> "gấm pha lụa";
                case "au-my" -> "taffeta phối ren";
                default -> "lụa pha";
            };
            case "ky-yeu" -> switch (parentSlug) {
                case "ao-dai" -> "lụa matte";
                case "vest-tot-nghiep" -> "tuytsi đứng form";
                case "cu-nhan" -> "poly graduation";
                case "dong-phuc-hoc-sinh" -> "cotton oxford";
                case "concept-chup-anh" -> "linen pha";
                default -> "poly mềm";
            };
            case "phu-kien" -> switch (parentSlug) {
                case "toc-gia" -> "sợi tơ nhiệt";
                case "giay" -> "da tổng hợp";
                case "vu-khi-mo-hinh" -> "foam cứng phủ sơn";
                case "trang-suc" -> "hợp kim mạ";
                case "dao-cu-chup-anh" -> "gỗ phủ sơn";
                case "trang-diem" -> "mỹ phẩm chuyên dụng";
                default -> "vật liệu tổng hợp";
            };
            default -> "poly";
        };
    }

    private String resolveGeneratedSilhouette(String rootSlug, String parentSlug) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "vest-trang-trong" -> "form đứng gọn";
                case "da-hoi" -> "phom dài tôn dáng";
                case "le-hoi" -> "layer linh hoạt";
                case "mascot" -> "jumpsuit rộng dễ vận động";
                case "bieu-dien" -> "phom sân khấu bắt sáng";
                case "gan-ket-doi-nhom" -> "form đồng bộ thoải mái";
                default -> "phom chỉn chu";
            };
            case "cosplay" -> switch (parentSlug) {
                case "anime" -> "phom nhân vật rõ nét";
                case "tro-choi" -> "form chiến đấu nhiều lớp";
                case "gia-tuong" -> "layer bay nhẹ";
                case "hoang-gia" -> "phom cổ điển sang trọng";
                case "phim-se-ri" -> "form điện ảnh nhận diện cao";
                default -> "form nhập vai";
            };
            case "trang-phuc-truyen-thong" -> switch (parentSlug) {
                case "nhat-ban" -> "phom truyền thống xếp nếp";
                case "han-quoc" -> "phom áo váy mềm nhiều lớp";
                case "viet-nam" -> "tà dài mềm thanh lịch";
                case "trung-quoc" -> "phom cổ phục bay nhẹ";
                case "au-my" -> "corset cổ điển và tùng xòe";
                default -> "phom truyền thống dễ mặc";
            };
            case "ky-yeu" -> switch (parentSlug) {
                case "ao-dai" -> "tà dài mềm";
                case "vest-tot-nghiep" -> "form đứng chuẩn ảnh";
                case "cu-nhan" -> "áo choàng suông";
                case "dong-phuc-hoc-sinh" -> "phom học đường gọn gàng";
                case "concept-chup-anh" -> "form chụp ảnh hài hòa";
                default -> "form dễ mặc";
            };
            case "phu-kien" -> switch (parentSlug) {
                case "toc-gia" -> "phom tóc ôm đầu tự nhiên";
                case "giay" -> "form ôm chân chắc chắn";
                case "vu-khi-mo-hinh" -> "tỷ lệ gọn tay";
                case "trang-suc" -> "chi tiết nhỏ nổi bật";
                case "dao-cu-chup-anh" -> "tỷ lệ phối cảnh vừa khung hình";
                case "trang-diem" -> "layout tôn đường nét";
                default -> "dễ phối đồ";
            };
            default -> "form tiêu chuẩn";
        };
    }

    private String resolveGeneratedRentalPrice(String rootSlug, String parentSlug) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "vest-trang-trong" -> "350000";
                case "da-hoi" -> "750000";
                case "le-hoi" -> "280000";
                case "mascot" -> "950000";
                case "bieu-dien" -> "420000";
                case "gan-ket-doi-nhom" -> "220000";
                default -> "300000";
            };
            case "cosplay" -> switch (parentSlug) {
                case "anime" -> "450000";
                case "tro-choi" -> "520000";
                case "gia-tuong" -> "580000";
                case "hoang-gia" -> "850000";
                case "phim-se-ri" -> "680000";
                default -> "480000";
            };
            case "trang-phuc-truyen-thong" -> switch (parentSlug) {
                case "nhat-ban" -> "420000";
                case "han-quoc" -> "390000";
                case "viet-nam" -> "320000";
                case "trung-quoc" -> "430000";
                case "au-my" -> "560000";
                default -> "380000";
            };
            case "ky-yeu" -> switch (parentSlug) {
                case "ao-dai" -> "320000";
                case "vest-tot-nghiep" -> "350000";
                case "cu-nhan" -> "220000";
                case "dong-phuc-hoc-sinh" -> "180000";
                case "concept-chup-anh" -> "260000";
                default -> "250000";
            };
            case "phu-kien" -> switch (parentSlug) {
                case "toc-gia" -> "90000";
                case "giay" -> "120000";
                case "vu-khi-mo-hinh" -> "140000";
                case "trang-suc" -> "70000";
                case "dao-cu-chup-anh" -> "60000";
                case "trang-diem" -> "150000";
                default -> "80000";
            };
            default -> "250000";
        };
    }

    private String resolveGeneratedDepositPrice(String rootSlug, String parentSlug) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "vest-trang-trong" -> "800000";
                case "da-hoi" -> "1800000";
                case "le-hoi" -> "650000";
                case "mascot" -> "2200000";
                case "bieu-dien" -> "900000";
                case "gan-ket-doi-nhom" -> "450000";
                default -> "600000";
            };
            case "cosplay" -> switch (parentSlug) {
                case "anime" -> "900000";
                case "tro-choi" -> "1100000";
                case "gia-tuong" -> "1200000";
                case "hoang-gia" -> "1800000";
                case "phim-se-ri" -> "1400000";
                default -> "950000";
            };
            case "trang-phuc-truyen-thong" -> switch (parentSlug) {
                case "nhat-ban" -> "950000";
                case "han-quoc" -> "900000";
                case "viet-nam" -> "700000";
                case "trung-quoc" -> "1000000";
                case "au-my" -> "1400000";
                default -> "850000";
            };
            case "ky-yeu" -> switch (parentSlug) {
                case "ao-dai" -> "700000";
                case "vest-tot-nghiep" -> "800000";
                case "cu-nhan" -> "500000";
                case "dong-phuc-hoc-sinh" -> "400000";
                case "concept-chup-anh" -> "600000";
                default -> "500000";
            };
            case "phu-kien" -> switch (parentSlug) {
                case "toc-gia" -> "220000";
                case "giay" -> "300000";
                case "vu-khi-mo-hinh" -> "300000";
                case "trang-suc" -> "180000";
                case "dao-cu-chup-anh" -> "150000";
                case "trang-diem" -> "300000";
                default -> "200000";
            };
            default -> "500000";
        };
    }

    private String resolveGeneratedFitNote(String rootSlug, String parentSlug, String leafName) {
        return switch (rootSlug) {
            case "su-kien" -> switch (parentSlug) {
                case "mascot" -> "Bộ mascot " + leafName + " được dựng phom ổn định, phù hợp hoạt náo trong nhiều không gian.";
                case "da-hoi" -> "Thiết kế ưu tiên lên ảnh và giữ phom đẹp khi di chuyển trong sự kiện dài.";
                default -> "Mẫu " + leafName + " dễ phối phụ kiện, phù hợp nhu cầu thuê nhanh cho sự kiện.";
            };
            case "cosplay" -> "Trang phục " + leafName + " ưu tiên nhận diện nhân vật và giữ phom ổn định khi chụp hình.";
            case "trang-phuc-truyen-thong" -> "Set " + leafName + " giữ tinh thần trang phục truyền thống, phù hợp lễ hội văn hóa, chụp concept và hoạt động trình diễn.";
            case "ky-yeu" -> "Set " + leafName + " dễ mặc, lên ảnh sáng và phù hợp lịch chụp kỷ yếu nhiều bối cảnh.";
            case "phu-kien" -> "Phụ kiện " + leafName + " giúp hoàn thiện outfit mà vẫn gọn nhẹ khi di chuyển.";
            default -> "Mẫu seed dev được bổ sung tự động để hoàn thiện catalog.";
        };
    }

    private static String extractRootSlug(String path) {
        int separatorIndex = path.indexOf('/');
        if (separatorIndex < 0) {
            return path;
        }
        return path.substring(0, separatorIndex);
    }

    private static String extractParentSlug(String path) {
        String parentPath = extractParentPath(path);
        if (parentPath == null) {
            return path;
        }
        int separatorIndex = parentPath.lastIndexOf('/');
        if (separatorIndex < 0) {
            return parentPath;
        }
        return parentPath.substring(separatorIndex + 1);
    }

    private User resolveCatalogOwner() {
        List<User> sellers = userRepository.findByRoleOrderByIdAsc(Role.SELLER);
        if (!sellers.isEmpty()) {
            return sellers.get(0);
        }

        return userRepository.findByEmail(DEV_SELLER_EMAIL)
                .map(existingUser -> {
                    existingUser.setRole(Role.SELLER);
                    existingUser.setStatus(UserStatus.ACTIVE);
                    existingUser.setEmailVerified(true);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    User seller = new User();
                    seller.setFullName("AuraFit Seller");
                    seller.setEmail(DEV_SELLER_EMAIL);
                    seller.setPasswordHash(passwordEncoder.encode(DEV_SELLER_PASSWORD));
                    seller.setRole(Role.SELLER);
                    seller.setStatus(UserStatus.ACTIVE);
                    seller.setEmailVerified(true);
                    seller.setPhoneVerified(false);
                    return userRepository.save(seller);
                });
    }

    private void upsertMetadata(CategorySeed categorySeed,
                                CostumeSeed costumeSeed,
                                Costume costume,
                                int categoryCostumeIndex) {
        CostumeMetadata metadata = costume.getMetadata();
        if (metadata == null) {
            metadata = costumeMetadataRepository.findByCostumeId(costume.getId())
                    .orElseGet(CostumeMetadata::new);
            metadata.setCostume(costume);
            costume.setMetadata(metadata);
        }

        metadata.setStyle(resolveStyle(categorySeed, costumeSeed));
        metadata.setOccasion(resolveOccasion(categorySeed, costumeSeed));
        metadata.setSeason(resolveSeason(categorySeed, costumeSeed, categoryCostumeIndex));
        metadata.setColor(costumeSeed.primaryColor());
        metadata.setTags(resolveTags(categorySeed, costumeSeed));
        metadata.setSkinTone(resolveSkinTone(categorySeed, costumeSeed));
        metadata.setBodyType(resolveBodyType(categorySeed, costumeSeed));
        metadata.setGender(resolveGender(categorySeed, costumeSeed));
        metadata.setSize(resolveSizeLabel(categorySeed, costumeSeed));
        metadata.setMaterial(costumeSeed.material());
        metadata.setFitNote(resolveFitNote(costumeSeed));

        costumeMetadataRepository.save(metadata);
    }

    private int upsertItems(CategorySeed categorySeed,
                            CostumeSeed costumeSeed,
                            Costume costume,
                            int categoryCostumeIndex,
                            int globalCostumeIndex,
                            int extraItemCursor,
                            Map<String, CostumeItem> itemsBySku) {
        int itemCount = 3 + (globalCostumeIndex % 6);
        List<String> sizeOptions = categorySeed.sizeOptions();
        List<String> colorOptions = costumeSeed.itemColors();

        for (int itemIndex = 0; itemIndex < itemCount; itemIndex++) {
            String sku = buildSku(categorySeed.code(), categoryCostumeIndex + 1, itemIndex + 1);
            CostumeItem item = itemsBySku.get(sku);
            if (item == null) {
                item = new CostumeItem();
                item.setSku(sku);
            }

            item.setSize(sizeOptions.get((globalCostumeIndex + itemIndex) % sizeOptions.size()));
            item.setColor(colorOptions.get((categoryCostumeIndex + itemIndex) % colorOptions.size()));
            item.setStatus(resolveItemStatus(itemIndex, extraItemCursor));
            item.setCostume(costume);

            if (itemIndex >= 2) {
                extraItemCursor++;
            }

            CostumeItem savedItem = costumeItemRepository.save(item);
            itemsBySku.put(savedItem.getSku(), savedItem);
        }

        return extraItemCursor;
    }

    private ItemStatus resolveItemStatus(int itemIndex, int extraItemCursor) {
        if (itemIndex < 2) {
            return ItemStatus.AVAILABLE;
        }
        return EXTRA_ITEM_STATUS_CYCLE[extraItemCursor % EXTRA_ITEM_STATUS_CYCLE.length];
    }

    private String buildDescription(CategorySeed categorySeed,
                                    CostumeSeed costumeSeed,
                                    int categoryCostumeIndex,
                                    int globalCostumeIndex) {
        String style = resolveStyle(categorySeed, costumeSeed).toLowerCase(Locale.ROOT);
        String occasion = resolveOccasion(categorySeed, costumeSeed).toLowerCase(Locale.ROOT);
        String season = resolveSeason(categorySeed, costumeSeed, categoryCostumeIndex).toLowerCase(Locale.ROOT);
        String material = costumeSeed.material().toLowerCase(Locale.ROOT);
        String color = costumeSeed.primaryColor().toLowerCase(Locale.ROOT);
        String silhouette = costumeSeed.silhouette().toLowerCase(Locale.ROOT);
        String fitNote = resolveFitNote(costumeSeed);

        return switch (globalCostumeIndex % 6) {
            case 0 -> String.format("%s sử dụng chất liệu %s trên nền %s với %s, giữ được tinh thần %s. %s Phù hợp cho %s và chụp hình mùa %s.",
                    costumeSeed.name(), material, color, silhouette, style, fitNote, occasion, season);
            case 1 -> String.format("%s nổi bật nhờ phom %s, bề mặt %s và tông %s lên ảnh rất sạch màu. %s Đây là lựa chọn dễ dùng cho %s cần cảm giác chỉn chu nhưng vẫn thoải mái.",
                    costumeSeed.name(), silhouette, material, color, fitNote, occasion);
            case 2 -> String.format("%s được dựng form theo hướng %s, kết hợp %s và sắc %s để tạo tổng thể có chiều sâu. %s Mẫu này hợp lịch trình %s, studio lẫn sân khấu nhỏ.",
                    costumeSeed.name(), style, material, color, fitNote, occasion);
            case 3 -> String.format("%s có %s giúp tổng thể gọn phom, tôn đường nét khi di chuyển và lên hình. Chất liệu %s giữ bề mặt ổn định trong mùa %s. %s",
                    costumeSeed.name(), silhouette, material, season, fitNote);
            case 4 -> String.format("%s ưu tiên cảm giác %s với bề mặt %s và tông %s dễ phối phụ kiện. %s Mẫu phù hợp cho %s, quay clip ngắn và các buổi chụp concept đồng bộ.",
                    costumeSeed.name(), style, material, color, fitNote, occasion);
            default -> String.format("%s là mẫu %s có %s, xử lý màu %s khá bắt sáng nhưng không gắt. %s Đây là set dễ mặc cho %s và vẫn giữ được form đẹp trong suốt buổi thuê.",
                    costumeSeed.name(), style, silhouette, color, fitNote, occasion);
        };
    }

    private String buildImageUrl(CategorySeed categorySeed, CostumeSeed costumeSeed) {
        return String.format("https://picsum.photos/seed/aurafit-%s-%s/900/1200",
                slugify(categorySeed.code()),
                slugify(costumeSeed.name()));
    }

    private String buildSku(String categoryCode, int costumeNumber, int itemNumber) {
        return String.format("AF-%s-%02d-%02d", categoryCode, costumeNumber, itemNumber);
    }

    private String resolveStyle(CategorySeed categorySeed, CostumeSeed costumeSeed) {
        return costumeSeed.styleOverride() != null ? costumeSeed.styleOverride() : categorySeed.defaultStyle();
    }

    private String resolveOccasion(CategorySeed categorySeed, CostumeSeed costumeSeed) {
        return costumeSeed.occasionOverride() != null ? costumeSeed.occasionOverride() : categorySeed.defaultOccasion();
    }

    private String resolveSeason(CategorySeed categorySeed, CostumeSeed costumeSeed, int categoryCostumeIndex) {
        if (costumeSeed.seasonOverride() != null) {
            return costumeSeed.seasonOverride();
        }
        return categorySeed.defaultSeasons().get(categoryCostumeIndex % categorySeed.defaultSeasons().size());
    }

    private List<String> resolveTags(CategorySeed categorySeed, CostumeSeed costumeSeed) {
        LinkedHashSet<String> tags = new LinkedHashSet<>();
        tags.addAll(categorySeed.sharedTags());
        tags.addAll(costumeSeed.accentTags());
        tags.add(costumeSeed.material());
        tags.add(costumeSeed.primaryColor());
        return new ArrayList<>(tags);
    }

    private String resolveGender(CategorySeed categorySeed, CostumeSeed costumeSeed) {
        return costumeSeed.genderOverride() != null ? costumeSeed.genderOverride() : categorySeed.defaultGender();
    }

    private String resolveBodyType(CategorySeed categorySeed, CostumeSeed costumeSeed) {
        return costumeSeed.bodyTypeOverride() != null ? costumeSeed.bodyTypeOverride() : categorySeed.defaultBodyType();
    }

    private String resolveSkinTone(CategorySeed categorySeed, CostumeSeed costumeSeed) {
        return costumeSeed.skinToneOverride() != null ? costumeSeed.skinToneOverride() : categorySeed.defaultSkinTone();
    }

    private String resolveSizeLabel(CategorySeed categorySeed, CostumeSeed costumeSeed) {
        return costumeSeed.sizeLabelOverride() != null ? costumeSeed.sizeLabelOverride() : categorySeed.defaultSizeLabel();
    }

    private String resolveFitNote(CostumeSeed costumeSeed) {
        return normalizeSentence(costumeSeed.fitNote());
    }

    private String costumeKey(String categoryName, String costumeName) {
        return normalizeKey(categoryName) + "|" + normalizeKey(costumeName);
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSentence(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        return trimmed.endsWith(".") ? trimmed : trimmed + ".";
    }

    private String slugify(String value) {
        return toSlug(value);
    }

    private static String toSlug(String value) {
        String normalized = Normalizer.normalize(
                        value.replace('Đ', 'D').replace('đ', 'd'),
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return normalized.toLowerCase(Locale.ROOT);
    }

    private static String extractParentPath(String path) {
        int separatorIndex = path.lastIndexOf('/');
        if (separatorIndex < 0) {
            return null;
        }
        return path.substring(0, separatorIndex);
    }

    private static Map<String, CategoryTreeSeedEntry> indexCategoryTreeSeeds(List<CategoryTreeSeed> seeds, String parentPath) {
        Map<String, CategoryTreeSeedEntry> indexedSeeds = new LinkedHashMap<>();

        for (int index = 0; index < seeds.size(); index++) {
            CategoryTreeSeed seed = seeds.get(index);
            String slug = toSlug(seed.name());
            String path = parentPath == null ? slug : parentPath + "/" + slug;

            indexedSeeds.put(path, new CategoryTreeSeedEntry(
                    seed.name(),
                    slug,
                    seed.description(),
                    index
            ));
            indexedSeeds.putAll(indexCategoryTreeSeeds(seed.children(), path));
        }

        return indexedSeeds;
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value);
    }

    private static Map<String, String> buildCatalogCategoryPathBySeedName() {
        return Map.ofEntries(
                Map.entry("Áo dài", "trang-phuc-truyen-thong/viet-nam/ao-dai-truyen-thong"),
                Map.entry("Vest", "su-kien/vest-trang-trong/vest-nam"),
                Map.entry("Váy dạ hội", "su-kien/da-hoi/dam-da-hoi"),
                Map.entry("Đầm dự tiệc", "su-kien/da-hoi/dam-cocktail"),
                Map.entry("Kimono", "trang-phuc-truyen-thong/nhat-ban/kimono"),
                Map.entry("Hanbok", "trang-phuc-truyen-thong/han-quoc/hanbok"),
                Map.entry("Cosplay Anime", "cosplay/anime/naruto"),
                Map.entry("Cosplay Game", "cosplay/tro-choi/genshin-impact"),
                Map.entry("Halloween", "su-kien/le-hoi/halloween"),
                Map.entry("Noel", "su-kien/le-hoi/noel"),
                Map.entry("Tốt nghiệp", "ky-yeu/cu-nhan/ao-cu-nhan"),
                Map.entry("Biểu diễn", "su-kien/bieu-dien/san-khau")
        );
    }

    private static List<CategoryTreeSeed> buildCategoryTreeSeeds() {
        return List.of(
                tree("Sự kiện",
                        tree("Vest & trang trọng",
                                tree("Vest nam"),
                                tree("Vest nữ"),
                                tree("Tuxedo"),
                                tree("Blazer")
                        ),
                        tree("Dạ hội",
                                tree("Đầm dạ hội"),
                                tree("Đầm prom"),
                                tree("Đầm cocktail")
                        ),
                        tree("Lễ hội",
                                tree("Halloween"),
                                tree("Noel"),
                                tree("Trung Thu"),
                                tree("Carnival")
                        ),
                        tree("Mascot",
                                tree("Gấu"),
                                tree("Thỏ"),
                                tree("Khủng long"),
                                tree("Linh vật doanh nghiệp")
                        ),
                        tree("Biểu diễn",
                                tree("MC"),
                                tree("Ca sĩ"),
                                tree("Nhảy múa"),
                                tree("Sân khấu")
                        ),
                        tree("Gắn kết đội nhóm",
                                tree("Đồng phục sự kiện"),
                                tree("Áo nhóm"),
                                tree("Trang phục trò chơi")
                        )
                ),
                tree("Cosplay",
                        tree("Anime",
                                tree("Naruto"),
                                tree("One Piece"),
                                tree("Demon Slayer"),
                                tree("Jujutsu Kaisen"),
                                tree("Attack on Titan"),
                                tree("Spy x Family")
                        ),
                        tree("Trò chơi",
                                tree("Genshin Impact"),
                                tree("Honkai Star Rail"),
                                tree("League of Legends"),
                                tree("Valorant"),
                                tree("Identity V")
                        ),
                        tree("Giả tưởng",
                                tree("Tiên tộc"),
                                tree("Phù thủy"),
                                tree("Pháp sư"),
                                tree("Tiên nữ"),
                                tree("Thiên thần"),
                                tree("Ác quỷ")
                        ),
                        tree("Hoàng gia",
                                tree("Hoàng tử"),
                                tree("Công chúa"),
                                tree("Hoàng hậu"),
                                tree("Hiệp sĩ"),
                                tree("Quý tộc châu Âu")
                        ),
                        tree("Phim & sê-ri",
                                tree("Harry Potter"),
                                tree("Marvel"),
                                tree("DC"),
                                tree("Star Wars")
                        )
                ),
                tree("Trang phục truyền thống",
                        tree("Nhật Bản",
                                tree("Kimono"),
                                tree("Yukata"),
                                tree("Hakama")
                        ),
                        tree("Hàn Quốc",
                                tree("Hanbok"),
                                tree("Dangui"),
                                tree("Cheollik")
                        ),
                        tree("Việt Nam",
                                tree("Áo dài trắng"),
                                tree("Áo dài truyền thống"),
                                tree("Áo dài cách tân")
                        ),
                        tree("Trung Quốc",
                                tree("Hán phục"),
                                tree("Sườn xám"),
                                tree("Đường trang")
                        ),
                        tree("Âu - Mỹ",
                                tree("Victorian"),
                                tree("Rococo"),
                                tree("Gatsby")
                        )
                ),
                tree("Kỷ yếu",
                        tree("Vest tốt nghiệp",
                                tree("Vest nam"),
                                tree("Vest nữ")
                        ),
                        tree("Cử nhân",
                                tree("Áo cử nhân"),
                                tree("Mũ cử nhân")
                        ),
                        tree("Đồng phục học sinh",
                                tree("THPT"),
                                tree("Sinh viên")
                        ),
                        tree("Concept chụp ảnh",
                                tree("Thanh xuân"),
                                tree("Studio"),
                                tree("Ngoại cảnh"),
                                tree("Lookbook")
                        )
                ),
                tree("Phụ kiện",
                        tree("Tóc giả",
                                tree("Anime"),
                                tree("Giả tưởng"),
                                tree("Idol")
                        ),
                        tree("Giày",
                                tree("Bốt"),
                                tree("Giày tây"),
                                tree("Giày cosplay")
                        ),
                        tree("Vũ khí mô hình",
                                tree("Kiếm"),
                                tree("Cung"),
                                tree("Gậy phép"),
                                tree("Khiên")
                        ),
                        tree("Trang sức",
                                tree("Vương miện"),
                                tree("Dây chuyền"),
                                tree("Bông tai"),
                                tree("Nhẫn")
                        ),
                        tree("Đạo cụ chụp ảnh",
                                tree("Quạt"),
                                tree("Ô"),
                                tree("Sách cổ"),
                                tree("Hoa")
                        ),
                        tree("Trang điểm",
                                tree("Trang điểm cosplay"),
                                tree("Trang điểm kỷ yếu"),
                                tree("Trang điểm dạ hội")
                        )
                )
        );
    }

    private static List<CategorySeed> buildCategorySeeds() {
        return List.of(
                category("AD", "Áo dài",
                        "Trang phục yearbook và truyền thống dành cho kỷ yếu, lễ cưới, chụp ảnh văn hóa và sự kiện trường học.",
                        "Truyền thống thanh lịch", "Kỷ yếu", list("Xuân", "Hè", "Thu"), "Nữ",
                        "Dáng cân đối", "Da sáng đến trung bình", "S-XL", list("S", "M", "L", "XL"),
                        list("áo dài", "truyền thống", "kỷ yếu", "chụp ảnh"),
                        costume("Áo dài đỏ truyền thống", "Đỏ son", "lụa tơ tằm", "dáng suông thêu chỉ vàng", "220000", "500000",
                                list("Đỏ son", "Đỏ đô"), list("hoa sen", "lễ cưới"),
                                null, "Lễ cưới", "Xuân", null, null, null, null,
                                "Tà áo rơi mềm, dễ tạo độ bay khi chụp ngoài trời"),
                        costume("Áo dài trắng học sinh", "Trắng ngà", "lụa habutai", "cổ cao tay dài gọn phom", "180000", "400000",
                                list("Trắng ngà", "Kem sữa"), list("kỷ yếu", "trường học"),
                                null, null, null, null, null, "Dáng mảnh", null,
                                "Form nhẹ, lên hình trong trẻo và không bị nặng người khi mặc lâu"),
                        costume("Áo dài cách tân xanh ngọc", "Xanh ngọc", "gấm lụa", "tay lửng phối tà ngắn hiện đại", "260000", "600000",
                                list("Xanh ngọc", "Xanh mint"), list("cách tân", "studio"),
                                "Truyền thống hiện đại", "Chụp ảnh", "Hè", null, null, null, null,
                                "Phần eo có độ ôm vừa phải nên hợp cả chụp studio lẫn đi sự kiện"),
                        costume("Áo dài cưới vàng ánh kim", "Vàng ánh kim", "gấm jacquard", "tà dài đính kết nhẹ ở ngực", "420000", "1200000",
                                list("Vàng ánh kim", "Vàng champagne"), list("cưới hỏi", "trang trọng"),
                                "Áo dài cưới sang trọng", "Lễ cưới", "Thu", null, null, null, null,
                                "Dáng lên trang trọng, hợp lễ gia tiên và chụp cặp đôi"),
                        costume("Áo dài thêu hoa sen hồng phấn", "Hồng phấn", "lụa organza", "thân áo mềm với họa tiết hoa sen nổi", "300000", "700000",
                                list("Hồng phấn", "Hồng pastel"), list("hoa sen", "dịu dàng"),
                                null, "Chụp ảnh", "Xuân", null, null, null, null,
                                "Tông màu sáng da, tạo cảm giác mềm và nữ tính khi lên ảnh"),
                        costume("Áo dài gấm xanh cổ vịt", "Xanh cổ vịt", "gấm dệt nổi", "phom cổ thuyền phối tay chít nhẹ", "340000", "800000",
                                list("Xanh cổ vịt", "Xanh rêu"), list("sự kiện", "cổ điển"),
                                null, "Sự kiện", "Thu", null, null, null, "Da trung tính",
                                "Chất vải đứng dáng giúp tổng thể sang hơn trong không gian ánh đèn vàng"),
                        costume("Áo dài nhung tím cổ thuyền", "Tím mận", "nhung mịn", "cổ thuyền ôm vai nhẹ", "360000", "850000",
                                list("Tím mận", "Tím khói"), list("retro", "chụp tối"),
                                "Truyền thống cổ điển", "Chụp ảnh", "Đông", null, null, null, "Da ngăm đến trung bình",
                                "Bề mặt nhung bắt sáng tốt, phù hợp concept ảnh tối và sân khấu nhỏ")
                ),
                category("VS", "Vest",
                        "Trang phục event, cưới hỏi, prom và chụp ảnh formal cho khách nam cần hình ảnh lịch lãm, chỉn chu.",
                        "Formal hiện đại", "Sự kiện", list("Thu", "Đông", "Quanh năm"), "Nam",
                        "Dáng vai ngang", "Da trung tính", "S-XXL", list("S", "M", "L", "XL", "XXL"),
                        list("vest", "formal", "cưới hỏi", "doanh nhân"),
                        costume("Vest đen công sở", "Đen", "wool pha", "phom hai cúc vai gọn", "250000", "600000",
                                list("Đen", "Xám than"), list("công sở", "meeting"),
                                null, "Sự kiện", "Quanh năm", null, null, null, null,
                                "Dễ chỉnh sơ mi và cà vạt, mặc cả ngày vẫn giữ độ gọn"),
                        costume("Vest xanh navy Hàn Quốc", "Xanh navy", "poly wool", "phom slim fit ve nhỏ", "320000", "800000",
                                list("Xanh navy", "Xanh midnight"), list("hàn quốc", "trẻ trung"),
                                "Formal trẻ trung", "Chụp ảnh", "Thu", null, null, "Dáng cao", null,
                                "Phom gọn thân trên, hợp chụp profile và kỷ yếu nam"),
                        costume("Vest chú rể trắng kem", "Trắng kem", "twill cao cấp", "áo khoác một hàng khuy với ve satin", "480000", "1500000",
                                list("Trắng kem", "Kem champagne"), list("chú rể", "tiệc cưới"),
                                "Lễ cưới sang trọng", "Lễ cưới", "Quanh năm", null, null, null, null,
                                "Màu sáng giúp ảnh cưới nổi bật, nên phối cùng sơ mi cổ đứng"),
                        costume("Vest xám doanh nhân", "Xám khói", "len pha co giãn", "dáng regular fit cân đối", "280000", "700000",
                                list("Xám khói", "Xám bạc"), list("doanh nhân", "sân khấu"),
                                null, "Sự kiện", "Đông", null, null, null, null,
                                "Dáng mặc rộng rãi hơn slim fit, hợp khách thích cảm giác dễ cử động"),
                        costume("Vest tuxedo đen satin", "Đen tuyền", "satin pha", "ve áo bản lớn và quần ly giữa", "520000", "1800000",
                                list("Đen tuyền", "Đen satin"), list("tuxedo", "gala"),
                                "Black tie cổ điển", "Gala", "Đông", null, null, null, null,
                                "Giữ form sang dưới ánh đèn hội trường và lên ảnh đêm rất gọn"),
                        costume("Vest be chụp ảnh vintage", "Be cát", "linen pha", "phom nhẹ với túi nắp cổ điển", "300000", "750000",
                                list("Be cát", "Nâu sáng"), list("vintage", "ngoại cảnh"),
                                "Formal vintage", "Chụp ảnh", "Xuân", null, null, "Dáng cân đối", null,
                                "Tông màu ấm, hợp concept film và bối cảnh sân vườn"),
                        costume("Vest nâu mocha lễ cưới", "Nâu mocha", "suiting wool", "áo ba mảnh với gile cùng tông", "430000", "1200000",
                                list("Nâu mocha", "Nâu hạt dẻ"), list("ba mảnh", "chú rể"),
                                null, "Lễ cưới", "Thu", null, null, null, "Da ngăm",
                                "Set ba mảnh tạo cảm giác đầy đặn hơn cho dáng người mảnh")
                ),
                category("VDH", "Váy dạ hội",
                        "Trang phục event, gala, prom và tiệc tối với phom nổi bật dành cho khách cần hình ảnh sang trọng.",
                        "Dạ hội sang trọng", "Gala", list("Thu", "Đông", "Quanh năm"), "Nữ",
                        "Dáng đồng hồ cát", "Da sáng đến trung bình", "XS-XL", list("XS", "S", "M", "L", "XL"),
                        list("váy dạ hội", "gala", "prom", "sang trọng"),
                        costume("Váy dạ hội đỏ ruby", "Đỏ ruby", "satin lụa", "dáng ôm xẻ tà cao", "450000", "1200000",
                                list("Đỏ ruby", "Đỏ rượu"), list("xẻ tà", "thảm đỏ"),
                                null, "Gala", "Đông", null, null, null, null,
                                "Phần hông ôm vừa phải, bước đi thoải mái nhưng vẫn giữ độ quyến rũ"),
                        costume("Váy công chúa pastel đính đá", "Hồng pastel", "tulle nhiều lớp", "chân váy bồng và corset nhẹ", "520000", "1500000",
                                list("Hồng pastel", "Hồng phấn"), list("công chúa", "đính đá"),
                                "Dạ hội ngọt ngào", "Prom", "Xuân", null, null, null, "Da sáng",
                                "Form bồng che bụng tốt, hợp concept sinh nhật và prom"),
                        costume("Váy đuôi cá xanh navy", "Xanh navy", "crepe cao cấp", "đuôi cá ôm gối và xòe cuối tà", "480000", "1300000",
                                list("Xanh navy", "Xanh midnight"), list("đuôi cá", "chụp flash"),
                                null, "Gala", "Thu", null, null, "Dáng cao", null,
                                "Thiết kế tôn chiều cao, hợp đi giày cao gót mũi nhọn"),
                        costume("Váy ánh kim champagne", "Champagne", "sequin lót lưới", "dáng suông lệch vai", "560000", "1600000",
                                list("Champagne", "Vàng nhạt"), list("ánh kim", "tiệc tối"),
                                "Dạ hội nổi bật", "Dự tiệc", "Đông", null, null, null, null,
                                "Bề mặt bắt sáng mạnh nên rất hợp sân khấu và ballroom"),
                        costume("Váy ren trắng cổ vuông", "Trắng kem", "ren hoa nổi", "tay dài ôm cổ vuông", "420000", "1100000",
                                list("Trắng kem", "Trắng ngà"), list("ren", "studio"),
                                "Thanh lịch cổ điển", "Chụp ảnh", "Xuân", null, null, null, null,
                                "Mẫu này hợp ánh sáng tự nhiên và concept tối giản tinh khôi"),
                        costume("Váy lệch vai tím khói", "Tím khói", "lụa chiffon", "tà rủ bất đối xứng", "470000", "1250000",
                                list("Tím khói", "Tím lavender"), list("lệch vai", "nữ tính"),
                                null, "Dự tiệc", "Thu", null, null, null, "Da trung tính",
                                "Phần vai khoe xương quai xanh đẹp, hợp makeup tông lạnh"),
                        costume("Váy cúp ngực đen huyền", "Đen huyền", "satin lì", "cúp ngực ôm thân với chân váy rủ dài", "580000", "1700000",
                                list("Đen huyền", "Đen than"), list("cúp ngực", "tiệc tối"),
                                "Dạ hội quyến rũ", "Gala", "Đông", null, null, null, null,
                                "Corset dựng tốt nên tổng thể rất gọn khi đứng sân khấu hoặc chụp beauty")
                ),
                category("DDT", "Đầm dự tiệc",
                        "Trang phục event, tiệc cocktail, sinh nhật và chụp ảnh cho khách cần mẫu dễ mặc nhưng vẫn lên hình nổi bật.",
                        "Nữ tính hiện đại", "Dự tiệc", list("Xuân", "Hè", "Thu"), "Nữ",
                        "Dáng cân đối", "Da sáng đến trung bình", "XS-XL", list("XS", "S", "M", "L", "XL"),
                        list("đầm tiệc", "cocktail", "tiệc tối", "chụp ảnh"),
                        costume("Đầm tiệc trà hồng pastel", "Hồng pastel", "lụa mềm", "dáng xòe ngắn tay phồng", "230000", "500000",
                                list("Hồng pastel", "Kem hồng"), list("tiệc trà", "nữ tính"),
                                null, "Dự tiệc", "Xuân", null, null, null, null,
                                "Váy nhẹ và dễ di chuyển, phù hợp buổi tiệc kéo dài nhiều giờ"),
                        costume("Đầm midi đen tối giản", "Đen", "crepe co giãn", "dáng midi ôm vừa với cổ tròn", "260000", "600000",
                                list("Đen", "Đen than"), list("tối giản", "city look"),
                                "Thanh lịch tối giản", "Sự kiện", "Quanh năm", null, null, null, null,
                                "Form sạch, hợp người thích vẻ ngoài gọn và ít phụ kiện"),
                        costume("Đầm ôm body đỏ rượu", "Đỏ rượu", "satin pha spandex", "ôm thân với đường drape eo", "320000", "800000",
                                list("Đỏ rượu", "Đỏ burgundy"), list("bodycon", "tiệc đêm"),
                                null, "Dự tiệc", "Thu", null, null, null, null,
                                "Chi tiết rút eo giúp tôn dáng và che phần bụng khá hiệu quả"),
                        costume("Đầm xòe xanh ngọc tay phồng", "Xanh ngọc", "tơ organza", "chân váy chữ A và tay phồng nhẹ", "280000", "650000",
                                list("Xanh ngọc", "Xanh mint"), list("xòe", "ngoài trời"),
                                null, "Chụp ảnh", "Hè", null, null, null, null,
                                "Thiết kế hợp tiệc sân vườn, lên hình tươi và nhẹ màu da"),
                        costume("Đầm sequin bạc nổi bật", "Bạc gương", "sequin lưới", "dáng ôm ngắn trên gối", "350000", "900000",
                                list("Bạc gương", "Bạc khói"), list("sequin", "club"),
                                "Party statement", "Biểu diễn", "Đông", null, null, null, null,
                                "Mẫu này nổi mạnh dưới ánh đèn LED nên hợp sân khấu nhỏ và tiệc tối"),
                        costume("Đầm lụa vàng champagne", "Vàng champagne", "lụa satin", "hai dây suông rủ theo thân", "300000", "700000",
                                list("Vàng champagne", "Kem vàng"), list("lụa rủ", "tiệc cưới"),
                                null, "Dự tiệc", "Thu", null, null, null, null,
                                "Bề mặt mềm, tạo cảm giác thanh lịch khi phối sandal mảnh"),
                        costume("Đầm hoa nhí kem cổ vuông", "Kem hoa", "voan phủ hoa", "dáng xòe midi cổ vuông", "240000", "550000",
                                list("Kem hoa", "Kem sữa"), list("hoa nhí", "dịu dàng"),
                                "Nữ tính mềm mại", "Chụp ảnh", "Xuân", null, null, null, null,
                                "Mẫu dễ mặc, hợp cả khách trẻ lẫn khách thích phong cách nhẹ nhàng")
                ),
                category("KM", "Kimono",
                        "Trang phục traditional và yearbook theo cảm hứng Nhật Bản, phù hợp lễ hội văn hóa, studio và concept chụp ảnh.",
                        "Nhật Bản cổ điển", "Lễ hội", list("Xuân", "Hè", "Thu"), "Nữ",
                        "Dáng cân đối", "Da sáng đến trung bình", "S-XL", list("S", "M", "L", "XL"),
                        list("kimono", "nhật bản", "lễ hội", "studio"),
                        costume("Kimono Sakura hồng phấn", "Hồng sakura", "lụa in hoa", "thắt obi bản lớn và tay rộng", "320000", "800000",
                                list("Hồng sakura", "Hồng phấn"), list("hoa anh đào", "obi"),
                                null, "Lễ hội", "Xuân", null, null, null, null,
                                "Màu sáng và họa tiết hoa giúp tổng thể dịu, rất hợp chụp ngoại cảnh"),
                        costume("Yukata xanh indigo", "Xanh indigo", "cotton Nhật", "dáng yukata nhẹ, buộc nơ sau lưng", "260000", "600000",
                                list("Xanh indigo", "Xanh navy"), list("yukata", "mùa hè"),
                                "Nhật Bản tối giản", "Lễ hội", "Hè", null, null, null, null,
                                "Chất cotton mặc thoáng, hợp sự kiện đông người hoặc di chuyển nhiều"),
                        costume("Kimono đỏ Nhật thêu quạt", "Đỏ Nhật", "gấm mềm", "tay áo rộng và viền thêu ánh vàng", "360000", "900000",
                                list("Đỏ Nhật", "Đỏ đô"), list("thêu quạt", "sân khấu"),
                                null, "Biểu diễn", "Thu", null, null, null, null,
                                "Tông màu nổi và chi tiết viền giúp set này lên đèn rất rõ khối"),
                        costume("Kimono đen hạc vàng", "Đen hạc vàng", "lụa dày", "phom dài chạm mắt cá với obi cứng", "390000", "1000000",
                                list("Đen hạc vàng", "Đen"), list("hạc", "cổ điển"),
                                "Nhật Bản trang trọng", "Chụp ảnh", "Đông", null, null, null, null,
                                "Phần tà dài tạo khung ảnh đẹp khi tạo dáng đứng nghiêng"),
                        costume("Yukata tím hoa tử đằng", "Tím tử đằng", "cotton in hoa", "dáng ngắn gọn với tay áo mềm", "280000", "650000",
                                list("Tím tử đằng", "Tím lavender"), list("hoa tử đằng", "phố đêm"),
                                null, "Lễ hội", "Hè", null, null, null, null,
                                "Set gọn và nhẹ, hợp hoạt động hội chợ hoặc đi bộ ngoài trời"),
                        costume("Kimono mùa xuân xanh lá", "Xanh lá non", "lụa satin mờ", "thân áo rủ với họa tiết lá phong", "340000", "850000",
                                list("Xanh lá non", "Xanh olive"), list("mùa xuân", "lá phong"),
                                null, "Chụp ảnh", "Xuân", null, null, null, null,
                                "Tông xanh giúp ảnh ngoài trời tươi mà không quá gắt màu"),
                        costume("Kimono kem hoa cúc", "Kem hoa cúc", "lụa crepe", "cổ chéo thanh thoát và obi thắt nơ", "300000", "720000",
                                list("Kem hoa cúc", "Kem sữa"), list("hoa cúc", "dịu dàng"),
                                "Nhật Bản nhẹ nhàng", "Studio", "Thu", null, null, null, null,
                                "Mẫu này hợp concept tối giản, makeup trong trẻo và nền giấy trơn")
                ),
                category("HB", "Hanbok",
                        "Trang phục yearbook và traditional theo phong cách Hàn Quốc, phù hợp chụp studio, lễ hội và concept cưới hỏi.",
                        "Hàn Quốc truyền thống", "Chụp ảnh", list("Xuân", "Thu", "Đông"), "Nữ",
                        "Dáng quả lê", "Da sáng đến trung bình", "S-XL", list("S", "M", "L", "XL"),
                        list("hanbok", "hàn quốc", "truyền thống", "studio"),
                        costume("Hanbok truyền thống xanh ngọc", "Xanh ngọc", "lụa hanbok", "jeogori ngắn phối váy xòe rộng", "310000", "750000",
                                list("Xanh ngọc", "Xanh mint"), list("truyền thống", "jeogori"),
                                null, "Chụp ảnh", "Xuân", null, null, null, null,
                                "Phần váy xòe che dáng tốt, hợp chụp nửa người lẫn toàn thân"),
                        costume("Hanbok cưới đỏ vàng", "Đỏ vàng", "gấm lụa", "váy nhiều lớp và nơ otgoreum nổi bật", "430000", "1200000",
                                list("Đỏ vàng", "Đỏ đô"), list("cưới", "otgoreum"),
                                "Hanbok lễ cưới", "Lễ cưới", "Thu", null, null, null, null,
                                "Set mang cảm giác trang trọng, hợp studio cưới và lễ gia đình"),
                        costume("Hanbok hồng pastel", "Hồng pastel", "lụa mỏng", "phom mềm nhẹ với chân váy dài", "280000", "650000",
                                list("Hồng pastel", "Kem hồng"), list("pastel", "ngọt ngào"),
                                null, "Chụp ảnh", "Xuân", null, null, null, null,
                                "Tông hồng sáng giúp gương mặt tươi hơn khi chụp close-up"),
                        costume("Hanbok tím lavender", "Tím lavender", "voan lụa", "tay áo rộng và váy rủ theo chuyển động", "295000", "700000",
                                list("Tím lavender", "Tím khói"), list("lavender", "studio"),
                                null, "Studio", "Thu", null, null, null, null,
                                "Màu tím nhạt rất hợp concept nền xám và ánh sáng mềm"),
                        costume("Hanbok xanh navy thêu mây", "Xanh navy", "gấm thêu", "jeogori đậm màu với váy tông lạnh", "350000", "850000",
                                list("Xanh navy", "Xanh midnight"), list("thêu mây", "trang trọng"),
                                null, "Sự kiện", "Đông", null, null, null, "Da trung tính",
                                "Phom đứng hơn các mẫu pastel nên lên ảnh nghiêm trang và rõ nét"),
                        costume("Hanbok trắng ngà chụp studio", "Trắng ngà", "lụa mờ", "thiết kế tinh giản với nơ rủ dài", "270000", "620000",
                                list("Trắng ngà", "Kem sữa"), list("studio", "tối giản"),
                                "Hàn Quốc tối giản", "Studio", "Xuân", null, null, null, null,
                                "Dễ phối phụ kiện tóc và tạo cảm giác nhẹ nhàng trong khung hình"),
                        costume("Hanbok vàng bơ hiện đại", "Vàng bơ", "organza pha", "áo ngắn phối váy rủ hiện đại", "300000", "680000",
                                list("Vàng bơ", "Kem vàng"), list("hiện đại", "fashion"),
                                "Hanbok hiện đại", "Chụp ảnh", "Hè", null, null, null, null,
                                "Form trẻ trung, hợp khách muốn phong cách Hàn nhưng không quá truyền thống")
                ),
                category("CA", "Cosplay Anime",
                        "Trang phục cosplay anime cho convention, event fan meeting, chụp character card và nội dung social media.",
                        "Cosplay anime", "Convention", list("Quanh năm", "Hè", "Thu"), "Unisex",
                        "Dáng linh hoạt", "Da sáng đến ngăm", "S-XXL", list("S", "M", "L", "XL", "XXL"),
                        list("cosplay", "anime", "character", "convention"),
                        costume("Gojo Satoru học viện chú thuật", "Đen", "kaki mềm", "áo cổ cao và quần suông hiện đại", "390000", "1000000",
                                list("Đen", "Đen than"), list("gojo", "jujutsu kaisen", "vô hạ hạn"),
                                null, null, null, null, "Nam", "Dáng cao", null,
                                "Set nam phom thẳng, dễ kết hợp tóc giả trắng và kính đen"),
                        costume("Frieren pháp sư du hành", "Trắng tím", "twill pha lụa", "áo choàng dài và chân váy xếp lớp", "420000", "1100000",
                                list("Trắng tím", "Tím nhạt"), list("frieren", "pháp sư", "elf"),
                                null, null, null, null, "Nữ", null, null,
                                "Trang phục rủ đẹp khi cầm trượng, hợp chụp ngoại cảnh fantasy"),
                        costume("Violet Evergarden thư ký chiến trường", "Xanh cổ vịt", "gấm pha", "váy xòe quân đội và nơ cổ bản lớn", "430000", "1200000",
                                list("Xanh cổ vịt", "Trắng kem"), list("violet evergarden", "brooch"),
                                null, "Chụp ảnh", "Thu", null, "Nữ", null, null,
                                "Chi tiết tay áo và nơ cổ lên ảnh rõ, hợp concept thư viện hoặc sân ga"),
                        costume("Tanjiro Kamado săn quỷ", "Xanh đen", "kaki Nhật", "haori caro và quần hakama gọn", "360000", "900000",
                                list("Xanh đen", "Nâu gỗ"), list("tanjiro", "demon slayer", "hanafuda"),
                                null, null, null, null, "Nam", null, null,
                                "Set chuyển động tốt, phù hợp pose kiếm và chụp nhóm nhân vật"),
                        costume("Nezuko Kamado dạ hội tre", "Hồng đào", "lụa gân", "kimono ngắn phối áo khoác đen", "350000", "850000",
                                list("Hồng đào", "Đen"), list("nezuko", "demon slayer", "ống tre"),
                                null, null, null, null, "Nữ", null, null,
                                "Phần váy xếp và tay áo rộng tạo độ bay đẹp khi quay video ngắn"),
                        costume("Saber Artoria váy giáp xanh", "Xanh royal", "satin giáp mềm", "corset chiến binh và váy xòe nhiều lớp", "470000", "1300000",
                                list("Xanh royal", "Bạc"), list("saber", "fate", "vương giả"),
                                "Cosplay fantasy anh hùng", "Convention", "Đông", null, "Nữ", null, null,
                                "Trang phục có điểm nhấn giáp nên lên ảnh rất rõ khối và thần thái"),
                        costume("Rem hầu gái lam", "Xanh lam", "cotton pha ren", "váy tạp dề phồng và nơ cài tóc", "330000", "780000",
                                list("Xanh lam", "Trắng"), list("rem", "maid", "re zero"),
                                null, "Fan meeting", "Quanh năm", null, "Nữ", null, null,
                                "Mẫu này hợp booth trong nhà, dễ lên ảnh cận và tương tác sân khấu")
                ),
                category("CG", "Cosplay Game",
                        "Trang phục cosplay game fantasy và sci-fi cho convention, livestream, teaser video và hoạt động cộng đồng game.",
                        "Cosplay game fantasy", "Convention", list("Quanh năm", "Hè", "Thu"), "Unisex",
                        "Dáng linh hoạt", "Da sáng đến ngăm", "S-XXL", list("S", "M", "L", "XL", "XXL"),
                        list("cosplay", "game", "fantasy", "convention"),
                        costume("Raiden Shogun điện ảnh", "Tím điện", "lụa giáp in chuyển sắc", "kimono battle với chi tiết đai eo", "480000", "1300000",
                                list("Tím điện", "Tím đậm"), list("raiden shogun", "genshin", "inazuma"),
                                null, null, null, null, "Nữ", null, null,
                                "Set lên ánh đèn tím rất đẹp, hợp pose kiếm và hậu cảnh tối"),
                        costume("2B YoRHa chiến đấu", "Đen trắng", "spandex pha da", "váy chiến đấu ôm thân và găng dài", "520000", "1500000",
                                list("Đen", "Trắng"), list("2b", "nier automata", "yorha"),
                                "Sci-fi sắc lạnh", "Convention", "Đông", null, "Nữ", null, null,
                                "Form ôm rõ dáng, nên phối cùng boot cao và tóc bob trắng"),
                        costume("Firefly Honkai Star Rail", "Xanh lục", "lụa kỹ thuật", "áo khoác ngắn phối chân váy battle", "460000", "1250000",
                                list("Xanh lục", "Trắng"), list("firefly", "honkai star rail", "sam"),
                                null, null, null, null, "Nữ", null, null,
                                "Tông màu sáng và chi tiết jacket giúp set lên hình rất hiện đại"),
                        costume("Kafka Honkai Star Rail", "Tím mận", "satin pha da", "áo khoác dài và bodysuit tối màu", "500000", "1450000",
                                list("Tím mận", "Đen"), list("kafka", "honkai star rail", "săn sao"),
                                null, "Livestream", "Quanh năm", null, "Nữ", null, "Da trung tính",
                                "Phom sắc và tối màu phù hợp concept cyber, cận cảnh gương mặt"),
                        costume("Hu Tao Genshin Impact", "Nâu đỏ", "gấm mềm", "áo dài cách điệu phối quần short", "420000", "1100000",
                                list("Nâu đỏ", "Đen"), list("hu tao", "genshin", "liyue"),
                                null, "Chụp ảnh", "Thu", null, "Nữ", null, null,
                                "Set gọn, dễ tạo dáng năng động và lên ảnh ngoại cảnh tốt"),
                        costume("Furina Fontaine trình diễn", "Xanh biển", "lụa ép nếp", "áo choàng tầng và chi tiết nơ lớn", "470000", "1280000",
                                list("Xanh biển", "Trắng"), list("furina", "genshin", "fontaine"),
                                "Fantasy trình diễn", "Biểu diễn", "Quanh năm", null, "Nữ", null, null,
                                "Nhiều lớp tà và nơ giúp tổng thể rất nổi khi đứng sân khấu"),
                        costume("Amiya Arknights chỉ huy", "Xanh xám", "kaki pha twill", "áo khoác đồng phục và chân váy ngắn", "410000", "1000000",
                                list("Xanh xám", "Đen"), list("amiya", "arknights", "rhodes island"),
                                null, "Convention", "Thu", null, "Nữ", null, null,
                                "Set cân bằng giữa độ nhận diện nhân vật và khả năng di chuyển cả ngày")
                ),
                category("HW", "Halloween",
                        "Trang phục hóa trang fantasy cho halloween, event chủ đề, party đêm và chụp ảnh concept kinh dị.",
                        "Fantasy lễ hội", "Halloween", list("Thu", "Đông"), "Unisex",
                        "Dáng linh hoạt", "Da sáng đến ngăm", "S-XXL", list("S", "M", "L", "XL", "XXL"),
                        list("halloween", "lễ hội", "hóa trang", "party"),
                        costume("Ma cà rồng quý tộc", "Đỏ đen", "nhung pha satin", "áo choàng dài cổ dựng và gile thêu", "340000", "850000",
                                list("Đỏ đen", "Đen"), list("ma cà rồng", "gothic"),
                                null, "Halloween", "Thu", null, "Nam", null, null,
                                "Áo choàng bay tốt khi chụp chuyển động và tạo khí chất rất rõ"),
                        costume("Phù thủy đêm trăng", "Tím đen", "voan pha nhung", "váy dài tay loe và áo choàng mũ nhọn", "320000", "800000",
                                list("Tím đen", "Đen"), list("phù thủy", "trăng"),
                                null, "Halloween", "Thu", null, "Nữ", null, null,
                                "Mẫu dễ phối nón rộng và chổi, hợp concept ánh nến hoặc sương mù"),
                        costume("Bí ngô nhí nhảnh", "Cam bí ngô", "nỉ mềm", "form tròn vui nhộn và tay chun", "220000", "450000",
                                list("Cam bí ngô", "Xanh lá"), list("bí ngô", "vui nhộn"),
                                "Party vui nhộn", "Party", "Thu", null, "Unisex", null, null,
                                "Set nhẹ, mặc lâu không bí, phù hợp event đông người và ảnh nhóm"),
                        costume("Zombie học đường", "Xám bẩn", "cotton wash", "sơ mi rách chủ đích và cà vạt xộc xệch", "260000", "500000",
                                list("Xám bẩn", "Trắng xám"), list("zombie", "học đường"),
                                null, "Halloween", "Thu", null, "Unisex", null, null,
                                "Chất liệu mềm nên thoải mái cho diễn xuất và di chuyển liên tục"),
                        costume("Thiên thần sa ngã", "Đen bạc", "voan lưới", "váy dài và cánh lông đen xám", "380000", "980000",
                                list("Đen bạc", "Bạc khói"), list("thiên thần sa ngã", "dark fantasy"),
                                "Fantasy u tối", "Party", "Đông", null, "Nữ", null, null,
                                "Phần cánh tạo silhouette mạnh, hợp sân khấu và concept đêm"),
                        costume("Ác quỷ đỏ sừng đen", "Đỏ đậm", "spandex pha da", "bodysuit phối áo choàng ngắn", "360000", "900000",
                                list("Đỏ đậm", "Đen"), list("ác quỷ", "sừng"),
                                null, "Halloween", "Thu", null, "Unisex", null, null,
                                "Set bó gọn, dễ phối phụ kiện sừng và trang điểm sắc nét"),
                        costume("Xác ướp sa mạc", "Kem cát", "cotton quấn dải", "layer quấn thân bất đối xứng", "280000", "620000",
                                list("Kem cát", "Nâu cát"), list("xác ướp", "sa mạc"),
                                null, "Party", "Đông", null, "Unisex", null, null,
                                "Các dải quấn được cố định sẵn nên mặc nhanh hơn set hóa trang thủ công")
                ),
                category("NL", "Noel",
                        "Trang phục event và lễ hội Giáng sinh cho noel, sân khấu cuối năm, chụp ảnh gia đình và activation thương hiệu.",
                        "Lễ hội Giáng sinh", "Noel", list("Đông"), "Unisex",
                        "Dáng linh hoạt", "Da sáng đến ngăm", "S-XXL", list("S", "M", "L", "XL", "XXL"),
                        list("noel", "giáng sinh", "event", "lễ hội"),
                        costume("Cô gái Noel đỏ nhung", "Đỏ nhung", "nhung mềm", "váy xòe viền lông trắng", "280000", "650000",
                                list("Đỏ nhung", "Trắng"), list("cô gái noel", "lông trắng"),
                                null, "Noel", "Đông", null, "Nữ", null, null,
                                "Màu đỏ lên ảnh nhận diện tốt, hợp booth và chụp tại trung tâm thương mại"),
                        costume("Ông già Noel cổ điển", "Đỏ đô", "dạ ép", "áo khoác dài bản rộng với thắt lưng đen", "300000", "700000",
                                list("Đỏ đô", "Đen"), list("ông già noel", "cổ điển"),
                                null, "Noel", "Đông", null, "Nam", null, null,
                                "Trang phục đủ độ dày để đứng ngoài trời ngắn giờ và giữ form tốt"),
                        costume("Công chúa tuyết xanh băng", "Xanh băng", "organza ánh nhũ", "váy dài tay loe và áo choàng mỏng", "420000", "1100000",
                                list("Xanh băng", "Bạc"), list("công chúa tuyết", "winter"),
                                "Winter fantasy", "Noel", "Đông", null, "Nữ", null, "Da sáng",
                                "Set hợp sân khấu ánh sáng lạnh và concept chụp mùa đông"),
                        costume("Tuần lộc nâu đáng yêu", "Nâu caramel", "nỉ lông mịn", "form jumpsuit mềm với mũ gắn sừng", "250000", "500000",
                                list("Nâu caramel", "Kem sữa"), list("tuần lộc", "vui nhộn"),
                                "Lễ hội vui nhộn", "Event", "Đông", null, "Unisex", null, null,
                                "Mẫu dễ mặc, hợp activation ngoài trời và ảnh nhóm gia đình"),
                        costume("Áo choàng Noel trắng bạc", "Trắng bạc", "lông tuyết nhân tạo", "áo choàng dài với nón trùm đầu", "350000", "850000",
                                list("Trắng bạc", "Bạc khói"), list("áo choàng", "tuyết"),
                                "Winter elegant", "Noel", "Đông", null, "Nữ", null, null,
                                "Phom dài tạo khung ảnh đẹp và giữ được cảm giác lễ hội cao cấp"),
                        costume("Elf Giáng sinh xanh lá", "Xanh lá", "cotton dạ", "áo tunic ngắn và mũ nhọn đặc trưng", "240000", "480000",
                                list("Xanh lá", "Đỏ"), list("elf", "workshop"),
                                null, "Event", "Đông", null, "Unisex", null, null,
                                "Trang phục năng động, phù hợp nhân sự hoạt náo và dẫn trò chơi"),
                        costume("Dạ tiệc Noel ánh kim", "Vàng ánh kim", "sequin satin", "đầm ôm vừa với tay rủ nhẹ", "370000", "900000",
                                list("Vàng ánh kim", "Champagne"), list("giáng sinh", "dạ tiệc"),
                                "Party cuối năm", "Dự tiệc", "Đông", null, "Nữ", null, null,
                                "Rất hợp tiệc công ty và sân khấu year-end với ánh đèn vàng")
                ),
                category("TN", "Tốt nghiệp",
                        "Trang phục yearbook và graduation cho lễ tốt nghiệp, chụp kỷ yếu, ảnh studio và ảnh nhóm ngoài trời.",
                        "Graduation trang trọng", "Tốt nghiệp", list("Quanh năm", "Hè"), "Unisex",
                        "Dáng cân đối", "Da sáng đến ngăm", "S-XXL", list("S", "M", "L", "XL", "XXL"),
                        list("graduation", "yearbook", "tốt nghiệp", "kỷ yếu"),
                        costume("Lễ phục cử nhân đen chuẩn", "Đen", "poly graduation", "áo choàng dài và mũ mortarboard cơ bản", "200000", "500000",
                                list("Đen", "Vàng"), list("cử nhân", "mortarboard"),
                                null, "Tốt nghiệp", "Quanh năm", null, "Unisex", null, null,
                                "Set cơ bản, dễ phối đồng phục hoặc áo sơ mi bên trong"),
                        costume("Lễ phục tốt nghiệp xanh navy", "Xanh navy", "poly dày", "áo choàng rũ vừa phải với nẹp màu", "220000", "550000",
                                list("Xanh navy", "Vàng"), list("tốt nghiệp", "khoa học"),
                                null, "Tốt nghiệp", "Hè", null, "Unisex", null, null,
                                "Màu navy lên hình trang trọng nhưng mềm hơn set đen truyền thống"),
                        costume("Áo choàng tốt nghiệp đỏ đô", "Đỏ đô", "poly satin", "áo choàng dài phối cổ chữ V", "230000", "600000",
                                list("Đỏ đô", "Kem"), list("tốt nghiệp", "danh dự"),
                                null, "Lễ trao bằng", "Quanh năm", null, "Unisex", null, null,
                                "Tông đỏ hợp sân khấu trao bằng và ảnh nhóm đông người"),
                        costume("Bộ tốt nghiệp trắng kem chụp studio", "Trắng kem", "lụa matte", "áo choàng sáng màu và mũ cùng tông", "260000", "650000",
                                list("Trắng kem", "Kem sữa"), list("studio", "sáng màu"),
                                "Graduation studio", "Chụp ảnh", "Xuân", null, "Unisex", null, "Da sáng",
                                "Set sáng màu tạo cảm giác hiện đại, hợp studio nền tối giản"),
                        costume("Áo choàng thủ khoa vàng nghệ", "Vàng nghệ", "poly dệt mờ", "áo choàng nổi màu và viền tay rộng", "250000", "620000",
                                list("Vàng nghệ", "Đen"), list("thủ khoa", "vinh danh"),
                                null, "Lễ vinh danh", "Quanh năm", null, "Unisex", null, null,
                                "Mẫu nổi bật trên sân khấu, phù hợp khách muốn tạo điểm nhấn cá nhân"),
                        costume("Set cử nhân kỷ yếu pastel", "Pastel xanh", "poly mềm", "áo choàng ngắn hơn phối dây tua pastel", "240000", "580000",
                                list("Pastel xanh", "Pastel hồng"), list("kỷ yếu", "pastel"),
                                "Graduation trẻ trung", "Kỷ yếu", "Xuân", null, "Unisex", null, null,
                                "Set nhẹ và tươi màu, phù hợp ảnh nhóm lớp theo concept trẻ"),
                        costume("Lễ phục chụp ảnh ngoài trời xám bạc", "Xám bạc", "poly chống nhăn", "áo choàng suông và viền cổ ánh bạc", "230000", "560000",
                                list("Xám bạc", "Đen"), list("ngoài trời", "chống nhăn"),
                                null, "Chụp ảnh", "Hè", null, "Unisex", null, null,
                                "Chất vải ít nhăn hơn khi di chuyển xa, hợp buổi chụp ngoại cảnh")
                ),
                category("BD", "Biểu diễn",
                        "Trang phục event và performance cho sân khấu, múa, MC, acoustic show và các hoạt động biểu diễn tập thể.",
                        "Sân khấu nổi bật", "Biểu diễn", list("Quanh năm"), "Unisex",
                        "Dáng linh hoạt", "Da sáng đến ngăm", "S-XL", list("S", "M", "L", "XL"),
                        list("biểu diễn", "sân khấu", "performance", "event"),
                        costume("Trang phục múa dân gian đỏ son", "Đỏ son", "lụa mềm", "áo yếm phối chân váy dài uyển chuyển", "280000", "700000",
                                list("Đỏ son", "Vàng"), list("múa dân gian", "uyển chuyển"),
                                "Biểu diễn truyền thống", "Biểu diễn", "Quanh năm", null, "Nữ", null, null,
                                "Trang phục nhẹ tay và tà, phù hợp động tác xoay người nhiều"),
                        costume("Trang phục nhảy hiện đại bạc gương", "Bạc gương", "sequin co giãn", "crop top phối quần ống rộng", "360000", "950000",
                                list("Bạc gương", "Đen"), list("nhảy hiện đại", "cover dance"),
                                "Performance hiện đại", "Biểu diễn", "Quanh năm", null, "Unisex", null, null,
                                "Set bắt sáng tốt, hợp sân khấu LED và quay clip nhóm"),
                        costume("Set biểu diễn cheer xanh cobalt", "Xanh cobalt", "thun thể thao", "váy ngắn xếp ly và áo ôm tay ngắn", "300000", "750000",
                                list("Xanh cobalt", "Trắng"), list("cheer", "năng động"),
                                "Performance năng động", "Biểu diễn", "Quanh năm", null, "Nữ", null, null,
                                "Chất vải co giãn tốt giúp di chuyển mạnh mà vẫn an toàn form"),
                        costume("Váy latin tua rua đen", "Đen", "lụa tua rua", "váy ôm thân ngắn với lớp tua chuyển động", "380000", "1000000",
                                list("Đen", "Đỏ"), list("latin", "dance"),
                                "Dance performance", "Biểu diễn", "Quanh năm", null, "Nữ", null, null,
                                "Phần tua tạo hiệu ứng rất rõ khi xoay hông và bước chân nhanh"),
                        costume("Set sân khấu vàng ánh đèn", "Vàng ánh đèn", "satin ánh kim", "áo khoác ngắn phối quần cạp cao", "340000", "850000",
                                list("Vàng ánh đèn", "Đen"), list("sân khấu", "ca sĩ"),
                                "Performance nổi bật", "Sự kiện", "Quanh năm", null, "Unisex", null, null,
                                "Set phù hợp MC mở màn, band nhạc hoặc tiết mục cần độ bắt sáng"),
                        costume("Bộ diễn acoustic trắng kem", "Trắng kem", "linen pha lụa", "áo sơ mi mềm và chân váy hoặc quần suông", "260000", "620000",
                                list("Trắng kem", "Be cát"), list("acoustic", "nhẹ nhàng"),
                                "Performance tối giản", "Biểu diễn", "Quanh năm", null, "Unisex", null, null,
                                "Thiết kế mộc, hợp sân khấu cà phê và concept âm nhạc gần gũi"),
                        costume("Trang phục MC tím sang trọng", "Tím than", "crepe cao cấp", "áo blazer cách điệu và chân váy bút chì", "330000", "780000",
                                list("Tím than", "Đen"), list("mc", "dẫn chương trình"),
                                "Stage formal", "Sự kiện", "Quanh năm", null, "Nữ", null, null,
                                "Giữ vẻ chỉn chu trước ống kính và không bị nhăn khi ngồi lâu")
                )
        );
    }

    private static CategorySeed category(String code,
                                         String name,
                                         String description,
                                         String defaultStyle,
                                         String defaultOccasion,
                                         List<String> defaultSeasons,
                                         String defaultGender,
                                         String defaultBodyType,
                                         String defaultSkinTone,
                                         String defaultSizeLabel,
                                         List<String> sizeOptions,
                                         List<String> sharedTags,
                                         CostumeSeed... costumes) {
        return new CategorySeed(code, name, description, defaultStyle, defaultOccasion, defaultSeasons,
                defaultGender, defaultBodyType, defaultSkinTone, defaultSizeLabel, sizeOptions, sharedTags,
                List.of(costumes));
    }

    private static CostumeSeed costume(String name,
                                       String primaryColor,
                                       String material,
                                       String silhouette,
                                       String rentalPrice,
                                       String depositPrice,
                                       List<String> itemColors,
                                       List<String> accentTags,
                                       String fitNote) {
        return costume(name, primaryColor, material, silhouette, rentalPrice, depositPrice, itemColors, accentTags,
                null, null, null, null, null, null, null, fitNote);
    }

    private static CostumeSeed costume(String name,
                                       String primaryColor,
                                       String material,
                                       String silhouette,
                                       String rentalPrice,
                                       String depositPrice,
                                       List<String> itemColors,
                                       List<String> accentTags,
                                       String styleOverride,
                                       String occasionOverride,
                                       String seasonOverride,
                                       String sizeLabelOverride,
                                       String genderOverride,
                                       String bodyTypeOverride,
                                       String skinToneOverride,
                                       String fitNote) {
        return new CostumeSeed(name, primaryColor, material, silhouette, rentalPrice, depositPrice, itemColors,
                accentTags, styleOverride, occasionOverride, seasonOverride, sizeLabelOverride,
                genderOverride, bodyTypeOverride, skinToneOverride, fitNote);
    }

    private static List<String> list(String... values) {
        return List.of(values);
    }

    private static CategoryTreeSeed tree(String name, CategoryTreeSeed... children) {
        return new CategoryTreeSeed(name, null, List.of(children));
    }

    private record CategorySeed(
            String code,
            String name,
            String description,
            String defaultStyle,
            String defaultOccasion,
            List<String> defaultSeasons,
            String defaultGender,
            String defaultBodyType,
            String defaultSkinTone,
            String defaultSizeLabel,
            List<String> sizeOptions,
            List<String> sharedTags,
            List<CostumeSeed> costumes
    ) {
    }

    private record CategoryTreeSeed(
            String name,
            String description,
            List<CategoryTreeSeed> children
    ) {
    }

    private record CategoryTreeSeedEntry(
            String name,
            String slug,
            String description,
            int sortOrder
    ) {
    }

    private record CostumeSeed(
            String name,
            String primaryColor,
            String material,
            String silhouette,
            String rentalPrice,
            String depositPrice,
            List<String> itemColors,
            List<String> accentTags,
            String styleOverride,
            String occasionOverride,
            String seasonOverride,
            String sizeLabelOverride,
            String genderOverride,
            String bodyTypeOverride,
            String skinToneOverride,
            String fitNote
    ) {
    }

}
