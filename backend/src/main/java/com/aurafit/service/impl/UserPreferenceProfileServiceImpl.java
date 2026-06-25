package com.aurafit.service.impl;

import com.aurafit.config.AiProperties;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.User;
import com.aurafit.entity.UserBehaviorEvent;
import com.aurafit.entity.UserPreferenceProfile;
import com.aurafit.enums.AiBehaviorEventType;
import com.aurafit.enums.OrderStatus;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.ProductAiMetadataRepository;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.repository.UserBehaviorEventRepository;
import com.aurafit.repository.UserPreferenceProfileRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AiDataCodec;
import com.aurafit.service.UserPreferenceProfileService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserPreferenceProfileServiceImpl implements UserPreferenceProfileService {

    private final UserPreferenceProfileRepository userPreferenceProfileRepository;
    private final UserBehaviorEventRepository userBehaviorEventRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final ProductAiMetadataRepository productAiMetadataRepository;
    private final UserRepository userRepository;
    private final AiDataCodec aiDataCodec;
    private final AiProperties aiProperties;

    public UserPreferenceProfileServiceImpl(UserPreferenceProfileRepository userPreferenceProfileRepository,
                                            UserBehaviorEventRepository userBehaviorEventRepository,
                                            RentalOrderRepository rentalOrderRepository,
                                            ProductAiMetadataRepository productAiMetadataRepository,
                                            UserRepository userRepository,
                                            AiDataCodec aiDataCodec,
                                            AiProperties aiProperties) {
        this.userPreferenceProfileRepository = userPreferenceProfileRepository;
        this.userBehaviorEventRepository = userBehaviorEventRepository;
        this.rentalOrderRepository = rentalOrderRepository;
        this.productAiMetadataRepository = productAiMetadataRepository;
        this.userRepository = userRepository;
        this.aiDataCodec = aiDataCodec;
        this.aiProperties = aiProperties;
    }

    @Override
    @Transactional(readOnly = false)
    public UserPreferenceProfile getOrRecomputeProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserPreferenceProfile profile = userPreferenceProfileRepository.findByUserId(userId)
                .orElse(UserPreferenceProfile.builder().user(user).profileVersion(0).build());

        if (profile.getLastComputedAt() != null
                && profile.getLastComputedAt().isAfter(LocalDateTime.now().minusMinutes(aiProperties.getProfileStaleMinutes()))) {
            return profile;
        }

        List<UserBehaviorEvent> events = userBehaviorEventRepository.findRecentByUserId(userId, PageRequest.of(0, 200));
        List<RentalOrder> orders = rentalOrderRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Set<Long> costumeIds = events.stream()
                .filter(event -> event.getCostume() != null)
                .map(event -> event.getCostume().getId())
                .collect(Collectors.toSet());
        orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.CONFIRMED
                        || order.getStatus() == OrderStatus.COMPLETED
                        || order.getStatus() == OrderStatus.RETURNED)
                .flatMap(order -> order.getDetails().stream())
                .map(detail -> detail.getCostumeItem().getCostume().getId())
                .forEach(costumeIds::add);

        Map<Long, ProductAiMetadata> metadataByCostumeId = costumeIds.isEmpty()
                ? Map.of()
                : productAiMetadataRepository.findAllByCostumeIds(costumeIds).stream()
                .collect(Collectors.toMap(metadata -> metadata.getCostume().getId(), metadata -> metadata));

        Map<String, Double> styles = new HashMap<>();
        Map<String, Double> occasions = new HashMap<>();
        Map<String, Double> colors = new HashMap<>();
        Map<String, Double> sizes = new HashMap<>();
        Map<String, Double> categories = new HashMap<>();
        Map<String, Double> genders = new HashMap<>();
        List<BigDecimal> budgets = new ArrayList<>();

        for (UserBehaviorEvent event : events) {
            double weight = weightForEvent(event.getEventType());
            if (event.getCostume() != null) {
                ProductAiMetadata metadata = metadataByCostumeId.get(event.getCostume().getId());
                if (metadata != null) {
                    applyWeighted(styles, aiDataCodec.readStringList(metadata.getStyleTagsJson()), weight);
                    applyWeighted(occasions, aiDataCodec.readStringList(metadata.getOccasionTagsJson()), weight);
                    applyWeighted(colors, aiDataCodec.readStringList(metadata.getColorTagsJson()), weight);
                    applyWeighted(sizes, aiDataCodec.readStringList(metadata.getSizeTagsJson()), weight);
                    applyWeighted(genders, aiDataCodec.readStringList(metadata.getGenderTagsJson()), weight);
                }
                applyWeighted(categories, List.of(event.getCostume().getCategory().getName()), weight);
                budgets.add(event.getCostume().getRentalPrice());
            }
            Map<String, Object> payload = aiDataCodec.readMap(event.getFilterPayload());
            applyWeighted(styles, castToStringList(payload.get("styleTags")), weight);
            applyWeighted(occasions, castToStringList(payload.get("occasionTags")), weight);
            applyWeighted(colors, castToStringList(payload.get("colorTags")), weight);
            applyWeighted(sizes, castToStringList(payload.get("sizeTags")), weight);
            applyWeighted(genders, castToStringList(payload.get("genderTags")), weight);
        }

        for (RentalOrder order : orders) {
            if (!(order.getStatus() == OrderStatus.CONFIRMED
                    || order.getStatus() == OrderStatus.COMPLETED
                    || order.getStatus() == OrderStatus.RETURNED)) {
                continue;
            }
            for (var detail : order.getDetails()) {
                ProductAiMetadata metadata = metadataByCostumeId.get(detail.getCostumeItem().getCostume().getId());
                if (metadata != null) {
                    applyWeighted(styles, aiDataCodec.readStringList(metadata.getStyleTagsJson()), 5d);
                    applyWeighted(occasions, aiDataCodec.readStringList(metadata.getOccasionTagsJson()), 5d);
                    applyWeighted(colors, aiDataCodec.readStringList(metadata.getColorTagsJson()), 5d);
                    applyWeighted(sizes, aiDataCodec.readStringList(metadata.getSizeTagsJson()), 5d);
                    applyWeighted(genders, aiDataCodec.readStringList(metadata.getGenderTagsJson()), 5d);
                }
                applyWeighted(categories, List.of(detail.getCostumeItem().getCostume().getCategory().getName()), 5d);
                budgets.add(detail.getCostumeItem().getCostume().getRentalPrice());
            }
        }

        List<String> topStyles = topKeys(styles);
        List<String> topOccasions = topKeys(occasions);
        List<String> topColors = topKeys(colors);
        List<String> topSizes = topKeys(sizes);
        List<String> topCategories = topKeys(categories);
        List<String> topGenders = topKeys(genders);

        profile.setPreferredStylesJson(aiDataCodec.toJson(topStyles));
        profile.setPreferredOccasionsJson(aiDataCodec.toJson(topOccasions));
        profile.setPreferredColorsJson(aiDataCodec.toJson(topColors));
        profile.setPreferredSizesJson(aiDataCodec.toJson(topSizes));
        profile.setPreferredCategoriesJson(aiDataCodec.toJson(topCategories));
        profile.setGenderAffinityJson(aiDataCodec.toJson(topGenders));
        profile.setPreferredBudgetMin(budgets.stream().min(Comparator.naturalOrder()).orElse(null));
        profile.setPreferredBudgetMax(budgets.stream().max(Comparator.naturalOrder()).orElse(null));
        profile.setProfileSummaryText(buildSummary(topStyles, topOccasions, topColors, topSizes, topCategories));
        profile.setLastComputedAt(LocalDateTime.now());
        profile.setProfileVersion((profile.getProfileVersion() == null ? 0 : profile.getProfileVersion()) + 1);

        return userPreferenceProfileRepository.save(profile);
    }

    private void applyWeighted(Map<String, Double> accumulator, List<String> values, double weight) {
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            accumulator.merge(value.trim(), weight, Double::sum);
        }
    }

    private double weightForEvent(AiBehaviorEventType eventType) {
        return switch (eventType) {
            case ADD_TO_CART -> 3d;
            case COMPLETE_RENTAL -> 5d;
            case CLICK_RECOMMENDATION -> 2d;
            case VIEW_PRODUCT, VIEW_RECOMMENDATION -> 1d;
            case APPLY_FILTER, SEARCH -> 1.5d;
            case SKIP_PRODUCT -> -0.5d;
        };
    }

    private List<String> topKeys(Map<String, Double> values) {
        return values.entrySet().stream()
                .filter(entry -> entry.getValue() > 0d)
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(aiProperties.getProfileTopTagLimit())
                .map(Map.Entry::getKey)
                .toList();
    }

    private List<String> castToStringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .map(String::valueOf)
                    .filter(item -> !item.isBlank())
                    .toList();
        }
        return List.of();
    }

    private String buildSummary(List<String> styles, List<String> occasions, List<String> colors, List<String> sizes, List<String> categories) {
        Map<String, List<String>> chunks = new LinkedHashMap<>();
        chunks.put("phong cach", styles);
        chunks.put("dip su dung", occasions);
        chunks.put("mau sac", colors);
        chunks.put("size", sizes);
        chunks.put("danh muc", categories);

        return chunks.entrySet().stream()
                .filter(entry -> !entry.getValue().isEmpty())
                .map(entry -> entry.getKey() + ": " + String.join(", ", entry.getValue()))
                .collect(Collectors.joining("; "));
    }
}
