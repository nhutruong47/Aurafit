package com.aurafit.config;

import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.CostumeMetadataRepository;
import com.aurafit.repository.CostumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
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

    private static final List<CategorySeed> CATEGORY_SEEDS = buildCategorySeeds();

    private final CategoryRepository categoryRepository;
    private final CostumeRepository costumeRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final CostumeMetadataRepository costumeMetadataRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedCatalog();
    }

    private void seedCatalog() {
        Map<String, Category> categoriesByKey = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(
                        category -> normalizeKey(category.getName()),
                        category -> category,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, Costume> costumesByKey = costumeRepository.findAllWithItems().stream()
                .collect(Collectors.toMap(
                        costume -> costumeKey(costume.getCategory() != null ? costume.getCategory().getName() : null, costume.getName()),
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
            Category category = upsertCategory(categorySeed, categoriesByKey);

            for (int categoryCostumeIndex = 0; categoryCostumeIndex < categorySeed.costumes().size(); categoryCostumeIndex++) {
                CostumeSeed costumeSeed = categorySeed.costumes().get(categoryCostumeIndex);
                Costume costume = upsertCostume(categorySeed, category, costumeSeed, categoryCostumeIndex, globalCostumeIndex, costumesByKey);
                upsertMetadata(categorySeed, costumeSeed, costume, categoryCostumeIndex);
                extraItemCursor = upsertItems(categorySeed, costumeSeed, costume, categoryCostumeIndex, globalCostumeIndex, extraItemCursor, itemsBySku);
                globalCostumeIndex++;
            }
        }

        log.info("DEV catalog seed synced: {} categories, {} costumes, {} costume items.",
                CATEGORY_SEEDS.size(), totalSeedCostumes(), totalSeedItems());
    }

    private Category upsertCategory(CategorySeed seed, Map<String, Category> categoriesByKey) {
        Category category = categoriesByKey.get(normalizeKey(seed.name()));
        if (category == null) {
            category = new Category();
        }

        category.setName(seed.name());
        category.setDescription(seed.description());

        Category savedCategory = categoryRepository.save(category);
        categoriesByKey.put(normalizeKey(savedCategory.getName()), savedCategory);
        return savedCategory;
    }

    private Costume upsertCostume(CategorySeed categorySeed,
                                  Category category,
                                  CostumeSeed costumeSeed,
                                  int categoryCostumeIndex,
                                  int globalCostumeIndex,
                                  Map<String, Costume> costumesByKey) {
        String key = costumeKey(categorySeed.name(), costumeSeed.name());
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

        Costume savedCostume = costumeRepository.save(costume);
        costumesByKey.put(key, savedCostume);
        return savedCostume;
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
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.toLowerCase(Locale.ROOT);
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value);
    }

    private int totalSeedCostumes() {
        return CATEGORY_SEEDS.stream()
                .mapToInt(category -> category.costumes().size())
                .sum();
    }

    private int totalSeedItems() {
        int total = 0;
        int costumeIndex = 0;
        for (CategorySeed categorySeed : CATEGORY_SEEDS) {
            for (int ignored = 0; ignored < categorySeed.costumes().size(); ignored++) {
                total += 3 + (costumeIndex % 6);
                costumeIndex++;
            }
        }
        return total;
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
