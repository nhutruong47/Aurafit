package com.aurafit.config;

import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds the database with realistic test data for Categories and Costumes.
 * Only active under the "dev" profile and is idempotent — skips if data already exists.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final CostumeRepository costumeRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // ── Idempotency check ────────────────────────────────────────────
        if (categoryRepository.count() > 0) {
            log.info("Database already contains data — skipping seed.");
            return;
        }

        log.info("Seeding database with initial test data...");

        // ── Categories ───────────────────────────────────────────────────
        Category animeCosplay = categoryRepository.save(
                Category.builder()
                        .name("Anime Cosplay")
                        .description("Trang phục cosplay từ các bộ anime nổi tiếng như Naruto, Demon Slayer, Jujutsu Kaisen.")
                        .build()
        );

        Category gamingCharacters = categoryRepository.save(
                Category.builder()
                        .name("Gaming Characters")
                        .description("Trang phục nhân vật từ các tựa game đình đám như Genshin Impact, League of Legends, Honkai Star Rail.")
                        .build()
        );

        Category traditionalVintage = categoryRepository.save(
                Category.builder()
                        .name("Traditional & Vintage")
                        .description("Trang phục truyền thống và cổ điển: áo dài, hanbok, kimono, trang phục thập niên 80.")
                        .build()
        );

        // ── Costumes ─────────────────────────────────────────────────────
        List<Costume> costumes = List.of(
                // --- Anime Cosplay ---
                Costume.builder()
                        .name("Tanjiro Kamado - Demon Slayer")
                        .description("Bộ trang phục Tanjiro Kamado đầy đủ gồm áo haori kẻ caro xanh đen, quần hakama, và hoa tai hanafuda. Chất liệu vải cao cấp, may đo tỉ mỉ.")
                        .rentalPrice(new BigDecimal("250000"))
                        .depositPrice(new BigDecimal("500000"))
                        .imageUrl("https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600&h=800&fit=crop")
                        .status(CostumeStatus.ACTIVE)
                        .category(animeCosplay)
                        .build(),

                Costume.builder()
                        .name("Gojo Satoru - Jujutsu Kaisen")
                        .description("Bộ đồng phục giáo viên Jujutsu Kaisen kèm mắt kính đặc trưng của Gojo Satoru. Bao gồm áo khoác đen, quần dài, và phụ kiện băng mắt.")
                        .rentalPrice(new BigDecimal("300000"))
                        .depositPrice(new BigDecimal("600000"))
                        .imageUrl("https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=600&h=800&fit=crop")
                        .status(CostumeStatus.ACTIVE)
                        .category(animeCosplay)
                        .build(),

                // --- Gaming Characters ---
                Costume.builder()
                        .name("Raiden Shogun - Genshin Impact")
                        .description("Trang phục Raiden Ei chi tiết cao với áo kimono tím, giáp nhẹ, và phụ kiện tóc. Phù hợp cho sự kiện cosplay và chụp ảnh.")
                        .rentalPrice(new BigDecimal("400000"))
                        .depositPrice(new BigDecimal("800000"))
                        .imageUrl("https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=800&fit=crop")
                        .status(CostumeStatus.ACTIVE)
                        .category(gamingCharacters)
                        .build(),

                Costume.builder()
                        .name("Jinx - Arcane / League of Legends")
                        .description("Bộ trang phục Jinx từ series Arcane gồm crop top, quần dài, găng tay, và bộ tóc xanh đặc trưng. Hoàn hảo cho cosplay convention.")
                        .rentalPrice(new BigDecimal("350000"))
                        .depositPrice(new BigDecimal("700000"))
                        .imageUrl("https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&h=800&fit=crop")
                        .status(CostumeStatus.ACTIVE)
                        .category(gamingCharacters)
                        .build(),

                // --- Traditional & Vintage ---
                Costume.builder()
                        .name("Áo Dài Truyền Thống - Đỏ Thêu Hoa Sen")
                        .description("Áo dài lụa đỏ thêu hoa sen tinh xảo, kèm quần trắng và phụ kiện khăn đóng. Phù hợp cho kỷ yếu, sự kiện văn hóa, và chụp ảnh truyền thống.")
                        .rentalPrice(new BigDecimal("200000"))
                        .depositPrice(new BigDecimal("400000"))
                        .imageUrl("https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop")
                        .status(CostumeStatus.ACTIVE)
                        .category(traditionalVintage)
                        .build(),

                Costume.builder()
                        .name("Kimono Nhật Bản - Hoa Anh Đào")
                        .description("Kimono truyền thống Nhật Bản với họa tiết hoa anh đào trên nền vải xanh navy. Bao gồm obi, geta, và phụ kiện tóc kanzashi.")
                        .rentalPrice(new BigDecimal("280000"))
                        .depositPrice(new BigDecimal("550000"))
                        .imageUrl("https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=800&fit=crop")
                        .status(CostumeStatus.ACTIVE)
                        .category(traditionalVintage)
                        .build(),

                Costume.builder()
                        .name("Hanbok Hàn Quốc - Pastel")
                        .description("Hanbok phong cách hiện đại với tông màu pastel nhẹ nhàng. Gồm jeogori (áo) và chima (váy). Lý tưởng cho chụp ảnh studio và sự kiện Hàn Quốc.")
                        .rentalPrice(new BigDecimal("260000"))
                        .depositPrice(new BigDecimal("500000"))
                        .imageUrl("https://images.unsplash.com/photo-1617440168937-c6497eaa8db5?w=600&h=800&fit=crop")
                        .status(CostumeStatus.ACTIVE)
                        .category(traditionalVintage)
                        .build(),

                Costume.builder()
                        .name("Naruto Uzumaki - Shippuden")
                        .description("Trang phục Naruto Uzumaki phiên bản Shippuden gồm áo khoác cam đen, quần ninja, và băng trán Konoha kim loại. Chất liệu bền, thoáng mát.")
                        .rentalPrice(new BigDecimal("220000"))
                        .depositPrice(new BigDecimal("450000"))
                        .imageUrl("https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=600&h=800&fit=crop")
                        .status(CostumeStatus.ACTIVE)
                        .category(animeCosplay)
                        .build()
        );

        costumeRepository.saveAll(costumes);

        log.info("✅ Database initialized with {} categories and {} costumes.",
                3, costumes.size());
    }
}
