package com.aurafit.config;

import com.aurafit.business.catalog.entity.Category;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.user.entity.User;
import com.aurafit.business.user.enums.Role;
import com.aurafit.business.catalog.repository.CategoryRepository;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.business.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Profile({ "dev", "seed" })
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final List<CategoryTreeSeed> CATEGORY_TREE_SEEDS = buildCategoryTreeSeeds();
    private static final Map<String, CategoryTreeSeedEntry> CATEGORY_TREE_SEEDS_BY_PATH = indexCategoryTreeSeeds(
            CATEGORY_TREE_SEEDS, null);

    private final CategoryRepository categoryRepository;
    private final CostumeRepository costumeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting clean data initialization...");
        seedUsers();
        seedCategories();
        log.info("Data initialization completed.");
    }

    private void seedCategories() {
        log.info("Starting category seed sync.");

        Map<String, Category> categoriesByPath = categoryRepository.findAll().stream()
                .filter(category -> category.getPath() != null && !category.getPath().isBlank())
                .collect(Collectors.toMap(
                        Category::getPath,
                        category -> category,
                        (left, right) -> left,
                        LinkedHashMap::new));

        int seededCategoryCount = syncCategoryTree(CATEGORY_TREE_SEEDS, null, categoriesByPath);
        CategoryCleanupResult cleanupResult = deleteStaleCategoriesAndCostumes(categoriesByPath);

        log.info(
                "Category seed synced: {} categories, {} stale costumes deleted, {} stale categories deleted.",
                seededCategoryCount,
                cleanupResult.deletedCostumeCount(),
                cleanupResult.deletedCategoryCount());
    }

    private int syncCategoryTree(List<CategoryTreeSeed> seeds, Category parent,
            Map<String, Category> categoriesByPath) {
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

    private CategoryCleanupResult deleteStaleCategoriesAndCostumes(Map<String, Category> categoriesByPath) {
        List<Category> staleCategories = categoriesByPath.values().stream()
                .filter(category -> !CATEGORY_TREE_SEEDS_BY_PATH.containsKey(category.getPath()))
                .sorted(Comparator.comparingInt(
                        (Category category) -> category.getPath().split("/").length
                ).reversed())
                .toList();

        if (staleCategories.isEmpty()) {
            return new CategoryCleanupResult(0, 0);
        }

        List<Costume> staleCostumes = costumeRepository.findAll().stream()
                .filter(costume -> costume.getCategory() != null)
                .filter(costume -> !CATEGORY_TREE_SEEDS_BY_PATH.containsKey(costume.getCategory().getPath()))
                .toList();

        if (!staleCostumes.isEmpty()) {
            costumeRepository.deleteAll(staleCostumes);
            costumeRepository.flush();
        }

        for (Category staleCategory : staleCategories) {
            categoryRepository.delete(staleCategory);
            categoryRepository.flush();
        }

        return new CategoryCleanupResult(staleCostumes.size(), staleCategories.size());
    }

    private void seedUsers() {
        createAccountIfNotExists("admin@aurafit.com", "System Admin", Role.ADMIN);
        createAccountIfNotExists("staff@aurafit.com", "Default Staff", Role.STAFF);
        createAccountIfNotExists("customer@aurafit.com", "Default Customer", Role.CUSTOMER);
    }

    private void createAccountIfNotExists(String email, String fullName, Role role) {
        if (!userRepository.existsByEmail(email)) {
            User user = new User();
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("12345678"));
            user.setRole(role);
            user.setFullName(fullName);
            user.setEmailVerified(true);
            userRepository.save(user);
            log.info("Created default account: {}", email);
        }
    }

    private static String slugify(String value) {
        String normalized = Normalizer.normalize(
                value.replace('Đ', 'D').replace('đ', 'd'),
                Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return normalized.toLowerCase(Locale.ROOT);
    }


    private static Map<String, CategoryTreeSeedEntry> indexCategoryTreeSeeds(List<CategoryTreeSeed> seeds,
            String parentPath) {
        Map<String, CategoryTreeSeedEntry> indexedSeeds = new LinkedHashMap<>();

        for (int index = 0; index < seeds.size(); index++) {
            CategoryTreeSeed seed = seeds.get(index);
            String slug = slugify(seed.name());
            String path = parentPath == null ? slug : parentPath + "/" + slug;

            indexedSeeds.put(path, new CategoryTreeSeedEntry(
                    seed.name(),
                    slug,
                    seed.description(),
                    index));
            indexedSeeds.putAll(indexCategoryTreeSeeds(seed.children(), path));
        }

        return indexedSeeds;
    }

    static boolean isSeedLeafCategoryPath(String path) {
        if (!CATEGORY_TREE_SEEDS_BY_PATH.containsKey(path)) {
            return false;
        }
        String childPathPrefix = path + "/";
        return CATEGORY_TREE_SEEDS_BY_PATH.keySet().stream()
                .noneMatch(candidate -> candidate.startsWith(childPathPrefix));
    }

    private static List<CategoryTreeSeed> buildCategoryTreeSeeds() {
        return List.of(
                tree("Sự kiện",
                        tree("Vest & trang trọng",
                                tree("Vest nam"),
                                tree("Vest nữ"),
                                tree("Tuxedo"),
                                tree("Blazer")),
                        tree("Dạ hội",
                                tree("Đầm dạ hội"),
                                tree("Đầm prom"),
                                tree("Đầm cocktail")),
                        tree("Lễ hội",
                                tree("Halloween"),
                                tree("Noel"),
                                tree("Trung Thu"),
                                tree("Carnival")),
                        tree("Mascot",
                                tree("Gấu"),
                                tree("Thỏ"),
                                tree("Khủng long"),
                                tree("Linh vật doanh nghiệp")),
                        tree("Biểu diễn",
                                tree("MC"),
                                tree("Ca sĩ"),
                                tree("Nhảy múa"),
                                tree("Sân khấu")),
                        tree("Gắn kết đội nhóm",
                                tree("Đồng phục sự kiện"),
                                tree("Áo nhóm"),
                                tree("Trang phục trò chơi"))),
                tree("Cosplay",
                        tree("Anime",
                                tree("Naruto"),
                                tree("One Piece"),
                                tree("Demon Slayer"),
                                tree("Jujutsu Kaisen"),
                                tree("Attack on Titan"),
                                tree("Spy x Family")),
                        tree("Trò chơi",
                                tree("Genshin Impact"),
                                tree("Honkai Star Rail"),
                                tree("League of Legends"),
                                tree("Valorant"),
                                tree("Identity V")),
                        tree("Giả tưởng",
                                tree("Tiên tộc"),
                                tree("Phù thủy"),
                                tree("Pháp sư"),
                                tree("Tiên nữ"),
                                tree("Thiên thần"),
                                tree("Ác quỷ")),
                        tree("Hoàng gia",
                                tree("Hoàng tử"),
                                tree("Công chúa"),
                                tree("Hoàng hậu"),
                                tree("Hiệp sĩ"),
                                tree("Quý tộc châu Âu")),
                        tree("Phim & sê-ri",
                                tree("Harry Potter"),
                                tree("Marvel"),
                                tree("DC"),
                                tree("Star Wars"))),
                tree("Trang phục truyền thống",
                        tree("Nhật Bản",
                                tree("Kimono"),
                                tree("Yukata"),
                                tree("Hakama")),
                        tree("Hàn Quốc",
                                tree("Hanbok"),
                                tree("Dangui"),
                                tree("Cheollik")),
                        tree("Việt Nam",
                                tree("Áo dài trắng"),
                                tree("Áo dài truyền thống"),
                                tree("Áo dài cách tân")),
                        tree("Trung Quốc",
                                tree("Hán phục"),
                                tree("Sườn xám"),
                                tree("Đường trang")),
                        tree("Âu - Mỹ",
                                tree("Victorian"),
                                tree("Rococo"),
                                tree("Gatsby"))),
                tree("Kỷ yếu",
                        tree("Vest tốt nghiệp",
                                tree("Vest nam"),
                                tree("Vest nữ")),
                        tree("Cử nhân",
                                tree("Áo cử nhân"),
                                tree("Mũ cử nhân")),
                        tree("Đồng phục học sinh",
                                tree("THPT"),
                                tree("Sinh viên")),
                        tree("Concept chụp ảnh",
                                tree("Thanh xuân"),
                                tree("Studio"),
                                tree("Ngoại cảnh"),
                                tree("Lookbook"))),
                tree("Phụ kiện",
                        tree("Tóc giả",
                                tree("Anime"),
                                tree("Giả tưởng"),
                                tree("Idol")),
                        tree("Giày",
                                tree("Bốt"),
                                tree("Giày tây"),
                                tree("Giày cosplay")),
                        tree("Vũ khí mô hình",
                                tree("Kiếm"),
                                tree("Cung"),
                                tree("Gậy phép"),
                                tree("Khiên")),
                        tree("Trang sức",
                                tree("Vương miện"),
                                tree("Dây chuyền"),
                                tree("Bông tai"),
                                tree("Nhẫn")),
                        tree("Đạo cụ chụp ảnh",
                                tree("Quạt"),
                                tree("Ô"),
                                tree("Sách cổ"),
                                tree("Hoa")),
                        tree("Trang điểm",
                                tree("Trang điểm cosplay"),
                                tree("Trang điểm kỷ yếu"),
                                tree("Trang điểm dạ hội"))));
    }

    private static CategoryTreeSeed tree(String name, CategoryTreeSeed... children) {
        return new CategoryTreeSeed(name, null, List.of(children));
    }

    private record CategoryTreeSeed(
            String name,
            String description,
            List<CategoryTreeSeed> children) {
    }

    private record CategoryTreeSeedEntry(
            String name,
            String slug,
            String description,
            int sortOrder) {
    }

    private record CategoryCleanupResult(
            int deletedCostumeCount,
            int deletedCategoryCount) {
    }
}
