package com.aurafit.config;

import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.User;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.Role;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.LinkedHashMap;

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
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting clean data initialization...");
        seedUsers();
        seedCostumes();
        log.info("Data initialization completed.");
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

    private void seedCostumes() {
        if (costumeRepository.count() > 0) {
            log.info("Costumes already seeded, skipping.");
            return;
        }
        
        List<CostumeSeed> seeds = List.of(
                new CostumeSeed("Premium Black Tuxedo", "Vest nam", 500000, 1500000, "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80"),
                new CostumeSeed("Classic Navy Suit", "Vest nam", 400000, 1200000, "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500&q=80"),
                new CostumeSeed("Elegant White Blazer", "Vest nữ", 350000, 1000000, "https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?w=500&q=80"),
                new CostumeSeed("Red Carpet Gown", "Đầm dạ hội", 800000, 3000000, "https://images.unsplash.com/photo-1566160984852-536f97ef8b6c?w=500&q=80"),
                new CostumeSeed("Sparkling Prom Dress", "Đầm prom", 600000, 2000000, "https://images.unsplash.com/photo-1568252542512-9fe8df9c64cb?w=500&q=80"),
                new CostumeSeed("Vampire Dracula Cloak", "Halloween", 200000, 500000, "https://images.unsplash.com/photo-1509314416550-2f9547d7c6da?w=500&q=80"),
                new CostumeSeed("Santa Claus Suit", "Noel", 250000, 600000, "https://images.unsplash.com/photo-1512413316925-fd4f5e821b36?w=500&q=80"),
                new CostumeSeed("Giant Brown Bear Mascot", "Gấu", 1000000, 4000000, "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500&q=80"),
                new CostumeSeed("Singer Stage Outfit", "Ca sĩ", 450000, 1200000, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80"),
                new CostumeSeed("Team Building Uniform", "Đồng phục sự kiện", 100000, 300000, "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&q=80"),
                new CostumeSeed("Naruto Shippuden Cosplay", "Naruto", 300000, 800000, "https://images.unsplash.com/photo-1608272535099-e6c1ed2b9ea9?w=500&q=80"),
                new CostumeSeed("Luffy Straw Hat Outfit", "One Piece", 300000, 800000, "https://images.unsplash.com/photo-1610452771505-18a7a514d03d?w=500&q=80"),
                new CostumeSeed("Genshin Impact Raiden Shogun", "Genshin Impact", 700000, 2500000, "https://images.unsplash.com/photo-1538356391444-633036e4f358?w=500&q=80"),
                new CostumeSeed("League of Legends Ahri", "League of Legends", 650000, 2200000, "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?w=500&q=80"),
                new CostumeSeed("Dark Witch Robe", "Phù thủy", 250000, 600000, "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=500&q=80"),
                new CostumeSeed("Medieval Knight Armor", "Hiệp sĩ", 1500000, 5000000, "https://images.unsplash.com/photo-1600868848492-9a3d4638a16f?w=500&q=80"),
                new CostumeSeed("Gryffindor Hogwarts Robe", "Harry Potter", 300000, 800000, "https://images.unsplash.com/photo-1618944847023-38aa001235f0?w=500&q=80"),
                new CostumeSeed("Traditional Japanese Kimono", "Kimono", 500000, 1500000, "https://images.unsplash.com/photo-1528359487563-7eb927233eb4?w=500&q=80"),
                new CostumeSeed("Elegant Hanbok", "Hanbok", 450000, 1300000, "https://images.unsplash.com/photo-1588656649479-7df9fce6312a?w=500&q=80"),
                new CostumeSeed("White Ao Dai Student", "Áo dài trắng", 200000, 600000, "https://images.unsplash.com/photo-1596767571343-2396bb2ba16d?w=500&q=80"),
                new CostumeSeed("Vintage Cheongsam", "Sườn xám", 350000, 1000000, "https://images.unsplash.com/photo-1582847240212-0a133a8a3a1d?w=500&q=80"),
                new CostumeSeed("Victorian Ball Gown", "Victorian", 900000, 3500000, "https://images.unsplash.com/photo-1566160984852-536f97ef8b6c?w=500&q=80"),
                new CostumeSeed("Graduation Gown & Cap", "Áo cử nhân", 150000, 400000, "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&q=80"),
                new CostumeSeed("Japanese School Uniform", "THPT", 200000, 500000, "https://images.unsplash.com/photo-1608272535099-e6c1ed2b9ea9?w=500&q=80"),
                new CostumeSeed("Silver Anime Wig", "Anime", 100000, 300000, "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=500&q=80"),
                new CostumeSeed("Brown Leather Boots", "Bốt", 150000, 500000, "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=500&q=80")
        );

        for (CostumeSeed seed : seeds) {
            Category category = getOrCreateCategory(seed.catKeyword);
            String slug = slugify(seed.name) + "-" + (System.currentTimeMillis() % 10000);
            
            Costume costume = Costume.builder()
                    .name(seed.name)
                    .slug(slug)
                    .description("Cao cấp và sang trọng. Phù hợp cho nhiều mục đích sử dụng. (Demo Data)")
                    .rentalPrice(BigDecimal.valueOf(seed.rental))
                    .depositPrice(BigDecimal.valueOf(seed.deposit))
                    .imageUrl(seed.imageUrl)
                    .status(CostumeStatus.ACTIVE)
                    .category(category)
                    .build();
            
            Costume savedCostume = costumeRepository.save(costume);
            
            // Generate items
            for (int i = 0; i < 3; i++) {
                String size = (i == 0) ? "S" : (i == 1) ? "M" : "L";
                for (int j = 0; j < 2; j++) {
                    String color = (j == 0) ? "Default" : "Variant";
                    CostumeItem item = CostumeItem.builder()
                            .costume(savedCostume)
                            .sku(slug.toUpperCase() + "-" + size + "-" + color.charAt(0) + j)
                            .size(size)
                            .color(color)
                            .status(ItemStatus.AVAILABLE)
                            .build();
                    costumeItemRepository.save(item);
                }
            }
        }
    }

    private Category getOrCreateCategory(String name) {
        String slug = slugify(name);
        return categoryRepository.findByPath(slug).orElseGet(() -> {
            Category cat = new Category();
            cat.setName(name);
            cat.setSlug(slug);
            cat.setPath(slug);
            cat.setIsActive(true);
            return categoryRepository.save(cat);
        });
    }

    private record CostumeSeed(String name, String catKeyword, long rental, long deposit, String imageUrl) {}

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
}
