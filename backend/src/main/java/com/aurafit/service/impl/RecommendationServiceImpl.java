package com.aurafit.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.dto.response.CostumeMetadataDTO;
import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.ItemStatus;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AiExplanationService;
import com.aurafit.service.RecommendationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.Cacheable;

@Service
@Transactional(readOnly = true)
public class RecommendationServiceImpl implements RecommendationService {

    private static final SimilarityWeights WEIGHTS = new SimilarityWeights();
    private static final HomepageWeights HOMEPAGE_WEIGHTS = new HomepageWeights();
    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {
    };

    private final CostumeRepository costumeRepository;
    private final UserRepository userRepository;
    private final UserInteractionEventRepository userInteractionEventRepository;
    private final ObjectMapper objectMapper;
    private final AiExplanationService aiExplanationService;

    public RecommendationServiceImpl(CostumeRepository costumeRepository,
            UserRepository userRepository,
            UserInteractionEventRepository userInteractionEventRepository,
            ObjectMapper objectMapper,
            AiExplanationService aiExplanationService) {
        this.costumeRepository = costumeRepository;
        this.userRepository = userRepository;
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.objectMapper = objectMapper;
        this.aiExplanationService = aiExplanationService;
    }

    @Override
    public List<SimilarCostumeRecommendationDTO> getSimilarCostumes(Long costumeId, int limit) {
        Costume sourceCostume = costumeRepository.findByIdWithItems(costumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", costumeId));

        int normalizedLimit = Math.max(1, Math.min(limit, 12));

        List<SimilarCostumeRecommendationDTO> recommendations = costumeRepository
                .findActiveWithItemsExcludingId(CostumeStatus.ACTIVE, costumeId).stream()
                .filter(candidate -> !sourceCostume.getId().equals(candidate.getId()))
                .map(candidate -> buildCandidate(sourceCostume, candidate))
                .filter(candidate -> candidate.availableItemCount() > 0)
                .sorted(Comparator
                        .comparingInt(SimilarCandidate::score).reversed()
                        .thenComparing(Comparator.comparingInt(SimilarCandidate::availableItemCount).reversed())
                        .thenComparing(candidate -> candidate.costume().getId(), Comparator.reverseOrder()))
                .limit(normalizedLimit)
                .map(candidate -> SimilarCostumeRecommendationDTO.fromEntity(
                        candidate.costume(),
                        candidate.reason(),
                        candidate.score(),
                        candidate.availableItemCount()))
                .toList();

        return aiExplanationService.enhanceRecommendationReasons(
                "similar_products",
                buildSimilarExplanationContext(sourceCostume),
                "vi",
                null,
                null,
                recommendations);
    }

    @Override
    @Cacheable(value = "homepage_recommendations", key = "#sessionId", condition = "#sessionId != null", sync = true)
    public List<SimilarCostumeRecommendationDTO> getHomepageRecommendations(String authenticatedEmail, String sessionId,
            int limit) {
        int normalizedLimit = Math.max(1, Math.min(limit, 12));
        User authenticatedUser = resolveAuthenticatedUser(authenticatedEmail);
        List<Costume> candidates = costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE);

        if (candidates.isEmpty()) {
            return List.of();
        }

        Map<Long, Costume> activeCostumesById = candidates.stream()
                .collect(Collectors.toMap(Costume::getId, costume -> costume, (left, right) -> left));

        List<UserInteractionEvent> recentEvents = loadRecentEvents(authenticatedUser, sessionId);
        PreferenceProfile profile = buildPreferenceProfile(recentEvents, activeCostumesById);

        if (profile.isEmpty()) {
            return aiExplanationService.enhanceRecommendationReasons(
                    "homepage_personalized",
                    "Gợi ý cá nhân hóa trang chủ cho người dùng chưa có đủ lịch sử rõ ràng.",
                    "vi",
                    null,
                    null,
                    buildHomepageFallbackRecommendations(candidates, normalizedLimit));
        }

        List<SimilarCostumeRecommendationDTO> recommendations = candidates.stream()
                .map(candidate -> buildHomepageCandidate(candidate, profile))
                .filter(candidate -> candidate.availableItemCount() > 0)
                .sorted(Comparator
                        .comparingInt(HomepageCandidate::score).reversed()
                        .thenComparing(Comparator.comparingInt(HomepageCandidate::availableItemCount).reversed())
                        .thenComparing(candidate -> candidate.costume().getId(), Comparator.reverseOrder()))
                .limit(normalizedLimit)
                .map(candidate -> SimilarCostumeRecommendationDTO.fromEntity(
                        candidate.costume(),
                        candidate.reason(),
                        candidate.score(),
                        candidate.availableItemCount()))
                .toList();

        return aiExplanationService.enhanceRecommendationReasons(
                "homepage_personalized",
                "Gợi ý cá nhân hóa trang chủ dựa trên lịch sử xem, tìm kiếm và thuê gần đây.",
                "vi",
                null,
                null,
                recommendations);
    }

    private SimilarCandidate buildCandidate(Costume sourceCostume, Costume candidate) {
        CostumeMetadataDTO sourceMetadata = CostumeMetadataDTO.fromEntity(sourceCostume.getMetadata());
        CostumeMetadataDTO candidateMetadata = CostumeMetadataDTO.fromEntity(candidate.getMetadata());
        int availableItemCount = countAvailableItems(candidate);
        boolean sameCategory = sourceCostume.getCategory() != null
                && candidate.getCategory() != null
                && sourceCostume.getCategory().getId() != null
                && sourceCostume.getCategory().getId().equals(candidate.getCategory().getId());

        boolean sameStyle = equalsIgnoreCase(sourceMetadata != null ? sourceMetadata.style() : null,
                candidateMetadata != null ? candidateMetadata.style() : null);
        boolean sameOccasion = equalsIgnoreCase(sourceMetadata != null ? sourceMetadata.occasion() : null,
                candidateMetadata != null ? candidateMetadata.occasion() : null);
        boolean sameSeason = equalsIgnoreCase(sourceMetadata != null ? sourceMetadata.season() : null,
                candidateMetadata != null ? candidateMetadata.season() : null);
        boolean sameColor = equalsIgnoreCase(sourceMetadata != null ? sourceMetadata.color() : null,
                candidateMetadata != null ? candidateMetadata.color() : null);
        int sharedTagCount = countSharedTags(
                sourceMetadata != null ? sourceMetadata.tags() : List.of(),
                candidateMetadata != null ? candidateMetadata.tags() : List.of());

        int score = 0;
        if (sameStyle) {
            score += WEIGHTS.style();
        }
        if (sameOccasion) {
            score += WEIGHTS.occasion();
        }
        if (sameSeason) {
            score += WEIGHTS.season();
        }
        if (sameColor) {
            score += WEIGHTS.color();
        }
        if (sameCategory) {
            score += WEIGHTS.category();
        }
        score += WEIGHTS.tagScore(sharedTagCount);
        score += WEIGHTS.availabilityBoost(availableItemCount);

        if (score == 0 && availableItemCount > 0) {
            score = WEIGHTS.availabilityBoost(availableItemCount);
        }

        String reason = buildReason(sameStyle, sameOccasion, sameSeason, sameColor, sharedTagCount, sameCategory);

        return new SimilarCandidate(candidate, score, availableItemCount, reason);
    }

    private HomepageCandidate buildHomepageCandidate(Costume candidate, PreferenceProfile profile) {
        CostumeMetadataDTO metadata = CostumeMetadataDTO.fromEntity(candidate.getMetadata());
        int availableItemCount = countAvailableItems(candidate);

        int directCostumeScore = profile.costumeScore(candidate.getId());
        int styleScore = profile.attributeScore(profile.styles(), metadata != null ? metadata.style() : null,
                HOMEPAGE_WEIGHTS.styleMatch());
        int occasionScore = profile.attributeScore(profile.occasions(), metadata != null ? metadata.occasion() : null,
                HOMEPAGE_WEIGHTS.occasionMatch());
        int seasonScore = profile.attributeScore(profile.seasons(), metadata != null ? metadata.season() : null,
                HOMEPAGE_WEIGHTS.seasonMatch());
        int colorScore = profile.attributeScore(profile.colors(), metadata != null ? metadata.color() : null,
                HOMEPAGE_WEIGHTS.colorMatch());
        int categoryScore = profile.attributeScore(profile.categories(),
                candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                HOMEPAGE_WEIGHTS.categoryMatch());
        int tagScore = profile.tagScore(metadata != null ? metadata.tags() : List.of(), HOMEPAGE_WEIGHTS.tagMatchUnit(),
                HOMEPAGE_WEIGHTS.tagMatchCap());
        int keywordScore = profile.keywordScore(candidate, HOMEPAGE_WEIGHTS.keywordMatchUnit(),
                HOMEPAGE_WEIGHTS.keywordMatchCap());
        int availabilityScore = HOMEPAGE_WEIGHTS.availabilityBoost(availableItemCount);

        int totalScore = directCostumeScore + styleScore + occasionScore + seasonScore + colorScore
                + categoryScore + tagScore + keywordScore + availabilityScore;

        if (totalScore == 0 && availableItemCount > 0) {
            totalScore = availabilityScore;
        }

        String reason = buildHomepageReason(
                directCostumeScore,
                styleScore,
                occasionScore,
                seasonScore,
                colorScore,
                categoryScore,
                tagScore,
                keywordScore);

        return new HomepageCandidate(candidate, totalScore, availableItemCount, reason);
    }

    private List<SimilarCostumeRecommendationDTO> buildHomepageFallbackRecommendations(List<Costume> candidates,
            int limit) {
        return candidates.stream()
                .map(candidate -> new HomepageCandidate(
                        candidate,
                        HOMEPAGE_WEIGHTS.availabilityBoost(countAvailableItems(candidate)),
                        countAvailableItems(candidate),
                        "Gợi ý phổ biến đang còn sẵn để thuê"))
                .filter(candidate -> candidate.availableItemCount() > 0)
                .sorted(Comparator
                        .comparingInt(HomepageCandidate::availableItemCount).reversed()
                        .thenComparing(candidate -> candidate.costume().getId(), Comparator.reverseOrder()))
                .limit(limit)
                .map(candidate -> SimilarCostumeRecommendationDTO.fromEntity(
                        candidate.costume(),
                        candidate.reason(),
                        candidate.score(),
                        candidate.availableItemCount()))
                .toList();
    }

    private List<UserInteractionEvent> loadRecentEvents(User authenticatedUser, String sessionId) {
        List<UserInteractionEvent> mergedEvents = new ArrayList<>();
        Set<Long> seenEventIds = new LinkedHashSet<>();

        if (authenticatedUser != null && authenticatedUser.getId() != null) {
            for (UserInteractionEvent event : userInteractionEventRepository
                    .findTop60ByUser_IdOrderByCreatedAtDesc(authenticatedUser.getId())) {
                if (event.getId() != null && seenEventIds.add(event.getId())) {
                    mergedEvents.add(event);
                }
            }
        }

        String normalizedSessionId = normalize(sessionId);
        if (normalizedSessionId != null) {
            for (UserInteractionEvent event : userInteractionEventRepository
                    .findTop60BySessionIdOrderByCreatedAtDesc(normalizedSessionId)) {
                if (event.getId() != null && seenEventIds.add(event.getId())) {
                    mergedEvents.add(event);
                }
            }
        }

        return mergedEvents.stream()
                .sorted(Comparator.comparing(UserInteractionEvent::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(60)
                .toList();
    }

    private PreferenceProfile buildPreferenceProfile(List<UserInteractionEvent> events,
            Map<Long, Costume> activeCostumesById) {
        PreferenceProfile profile = new PreferenceProfile();

        for (int index = 0; index < events.size(); index++) {
            UserInteractionEvent event = events.get(index);
            int eventWeight = HOMEPAGE_WEIGHTS.eventWeight(event.getEventType(), index);
            if (eventWeight <= 0) {
                continue;
            }

            Long costumeId = parseLong(event.getTargetId());
            if (costumeId != null && event.getTargetType() == com.aurafit.enums.InteractionTargetType.COSTUME) {
                Costume sourceCostume = activeCostumesById.get(costumeId);
                if (sourceCostume != null) {
                    profile.addCostumeInterest(costumeId,
                            HOMEPAGE_WEIGHTS.directCostumeBoost(event.getEventType(), index));
                    profile.addCostumeMetadata(sourceCostume, eventWeight);
                }
            }

            profile.addMetadata(parseMetadataMap(event.getMetadataJson()), eventWeight);
            profile.addKeywords(event.getQueryText(), HOMEPAGE_WEIGHTS.keywordEventBoost(event.getEventType()));
        }

        return profile;
    }

    private Map<String, Object> parseMetadataMap(String metadataJson) {
        if (metadataJson == null || metadataJson.trim().isEmpty()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(metadataJson.trim(), METADATA_TYPE);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private String buildHomepageReason(
            int directCostumeScore,
            int styleScore,
            int occasionScore,
            int seasonScore,
            int colorScore,
            int categoryScore,
            int tagScore,
            int keywordScore) {
        if (directCostumeScore > 0) {
            return "Dựa trên sản phẩm bạn đã xem gần đây";
        }

        int strongestScore = Math.max(
                Math.max(directCostumeScore, styleScore),
                Math.max(
                        Math.max(occasionScore, seasonScore),
                        Math.max(Math.max(colorScore, categoryScore), Math.max(tagScore, keywordScore))));

        if (strongestScore == styleScore && strongestScore > 0) {
            return "Dựa trên phong cách bạn quan tâm";
        }
        if (strongestScore == occasionScore && strongestScore > 0) {
            return "Phù hợp với dịp bạn đang quan tâm";
        }
        if (strongestScore == seasonScore && strongestScore > 0) {
            return "Phù hợp với mùa bạn đang tìm kiếm";
        }
        if (strongestScore == colorScore && strongestScore > 0) {
            return "Màu sắc hợp với sở thích gần đây của bạn";
        }
        if (strongestScore == categoryScore && strongestScore > 0) {
            return "Thuộc danh mục bạn đang quan tâm";
        }
        if (strongestScore == tagScore && strongestScore > 0) {
            return "Có tag gần với nhu cầu bạn đã xem";
        }
        if (strongestScore == keywordScore && strongestScore > 0) {
            return "Liên quan tới từ khóa bạn đã tìm";
        }

        return "Gợi ý phổ biến đang còn sẵn để thuê";
    }

    private int countAvailableItems(Costume costume) {
        return (int) costume.getItems().stream()
                .map(CostumeItem::getStatus)
                .filter(ItemStatus.AVAILABLE::equals)
                .count();
    }

    private int countSharedTags(List<String> sourceTags, List<String> candidateTags) {
        Set<String> normalizedSourceTags = normalizeTags(sourceTags);
        if (normalizedSourceTags.isEmpty()) {
            return 0;
        }

        Set<String> normalizedCandidateTags = normalizeTags(candidateTags);
        normalizedSourceTags.retainAll(normalizedCandidateTags);
        return normalizedSourceTags.size();
    }

    private Set<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return new LinkedHashSet<>();
        }

        LinkedHashSet<String> normalizedTags = new LinkedHashSet<>();
        for (String tag : tags) {
            String normalized = normalize(tag);
            if (normalized != null && !normalized.isBlank()) {
                normalizedTags.add(normalized);
            }
        }
        return normalizedTags;
    }

    private String buildReason(
            boolean sameStyle,
            boolean sameOccasion,
            boolean sameSeason,
            boolean sameColor,
            int sharedTagCount,
            boolean sameCategory) {
        if (sameStyle && sameOccasion) {
            return "Cùng phong cách, phù hợp cùng dịp sử dụng";
        }
        if (sameStyle && sharedTagCount > 0) {
            return "Cùng phong cách, có tag tương tự";
        }
        if (sameOccasion && sameSeason) {
            return "Phù hợp cùng dịp sử dụng và cùng mùa";
        }
        if (sameColor && sameSeason) {
            return "Cùng màu sắc và cùng mùa";
        }
        if (sharedTagCount > 0) {
            return "Có tag tương tự";
        }
        if (sameStyle) {
            return "Cùng phong cách";
        }
        if (sameOccasion) {
            return "Phù hợp cùng dịp sử dụng";
        }
        if (sameSeason) {
            return "Cùng mùa";
        }
        if (sameColor) {
            return "Cùng màu sắc";
        }
        if (sameCategory) {
            return "Sản phẩm đang còn sẵn để thuê";
        }
        return "Sản phẩm đang còn sẵn để thuê";
    }

    private boolean equalsIgnoreCase(String left, String right) {
        String normalizedLeft = normalize(left);
        String normalizedRight = normalize(right);
        return normalizedLeft != null && normalizedLeft.equals(normalizedRight);
    }

    private String buildSimilarExplanationContext(Costume sourceCostume) {
        if (sourceCostume == null) {
            return "Gợi ý sản phẩm tương tự cho trang chi tiết.";
        }

        CostumeMetadataDTO metadata = CostumeMetadataDTO.fromEntity(sourceCostume.getMetadata());
        return "Gợi ý sản phẩm tương tự cho costume \"" + sourceCostume.getName() + "\""
                + " | style=" + safe(metadata != null ? metadata.style() : null)
                + " | occasion=" + safe(metadata != null ? metadata.occasion() : null)
                + " | season=" + safe(metadata != null ? metadata.season() : null)
                + " | color=" + safe(metadata != null ? metadata.color() : null);
    }

    private User resolveAuthenticatedUser(String authenticatedEmail) {
        String normalizedEmail = normalize(authenticatedEmail);
        if (normalizedEmail == null) {
            return null;
        }

        return userRepository.findByEmail(normalizedEmail)
                .orElse(null);
    }

    private Long parseLong(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }

        try {
            return Long.parseLong(normalized);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "không rõ" : value;
    }

    private record SimilarCandidate(Costume costume, int score, int availableItemCount, String reason) {
    }

    private record HomepageCandidate(Costume costume, int score, int availableItemCount, String reason) {
    }

    private static final class SimilarityWeights {

        // Style is the strongest signal because recommendation is costume-level first.
        private static final int STYLE = 40;

        // Occasion is the next most important signal in a rental flow.
        private static final int OCCASION = 28;

        // Season helps narrow suggestions but should not outweigh style/occasion.
        private static final int SEASON = 18;

        // Color is a visual similarity hint, weaker than concept-level metadata.
        private static final int COLOR = 14;

        // Category is a fallback signal when metadata is thin or missing.
        private static final int CATEGORY = 10;

        // Each shared tag adds value, but tags should not dominate the total score.
        private static final int TAG_UNIT = 6;
        private static final int TAG_CAP = 18;

        // Availability count is only a tie-breaker, not a primary recommendation
        // signal.
        private static final int AVAILABILITY_CAP = 3;

        int style() {
            return STYLE;
        }

        int occasion() {
            return OCCASION;
        }

        int season() {
            return SEASON;
        }

        int color() {
            return COLOR;
        }

        int category() {
            return CATEGORY;
        }

        int tagScore(int sharedTagCount) {
            return Math.min(TAG_CAP, Math.max(sharedTagCount, 0) * TAG_UNIT);
        }

        int availabilityBoost(int availableItemCount) {
            return Math.min(AVAILABILITY_CAP, Math.max(availableItemCount, 0));
        }
    }

    private static final class HomepageWeights {

        // Rental and cart actions are stronger purchase-intent signals than plain
        // views.
        private static final int RENT_EVENT = 8;
        private static final int ADD_TO_CART_EVENT = 6;
        private static final int RECOMMENDATION_CLICK_EVENT = 5;
        private static final int VIEW_PRODUCT_EVENT = 3;
        private static final int SEARCH_EVENT = 2;
        private static final int CHAT_QUERY_EVENT = 2;

        // Recent events should matter more, but only as a light bias.
        private static final int RECENT_EVENT_BONUS_FIRST_FIVE = 2;
        private static final int RECENT_EVENT_BONUS_NEXT_FIVE = 1;

        // Match multipliers for the homepage profile.
        private static final int DIRECT_COSTUME = 12;
        private static final int STYLE_MATCH = 4;
        private static final int OCCASION_MATCH = 3;
        private static final int SEASON_MATCH = 2;
        private static final int COLOR_MATCH = 2;
        private static final int CATEGORY_MATCH = 2;
        private static final int TAG_MATCH_UNIT = 2;
        private static final int TAG_MATCH_CAP = 12;
        private static final int KEYWORD_MATCH_UNIT = 2;
        private static final int KEYWORD_MATCH_CAP = 8;
        private static final int AVAILABILITY_CAP = 3;

        int eventWeight(InteractionEventType eventType, int eventIndex) {
            int base = switch (eventType) {
                case RENT -> RENT_EVENT;
                case ADD_TO_CART -> ADD_TO_CART_EVENT;
                case RECOMMENDATION_CLICK -> RECOMMENDATION_CLICK_EVENT;
                case VIEW_PRODUCT -> VIEW_PRODUCT_EVENT;
                case SEARCH -> SEARCH_EVENT;
                case CHAT_QUERY -> CHAT_QUERY_EVENT;
                default -> 0;
            };

            return base + recencyBonus(eventIndex);
        }

        int directCostumeBoost(InteractionEventType eventType, int eventIndex) {
            return switch (eventType) {
                case VIEW_PRODUCT, RECOMMENDATION_CLICK -> DIRECT_COSTUME + recencyBonus(eventIndex);
                default -> 0;
            };
        }

        int keywordEventBoost(InteractionEventType eventType) {
            return switch (eventType) {
                case SEARCH, CHAT_QUERY -> 2;
                default -> 0;
            };
        }

        int styleMatch() {
            return STYLE_MATCH;
        }

        int occasionMatch() {
            return OCCASION_MATCH;
        }

        int seasonMatch() {
            return SEASON_MATCH;
        }

        int colorMatch() {
            return COLOR_MATCH;
        }

        int categoryMatch() {
            return CATEGORY_MATCH;
        }

        int tagMatchUnit() {
            return TAG_MATCH_UNIT;
        }

        int tagMatchCap() {
            return TAG_MATCH_CAP;
        }

        int keywordMatchUnit() {
            return KEYWORD_MATCH_UNIT;
        }

        int keywordMatchCap() {
            return KEYWORD_MATCH_CAP;
        }

        int availabilityBoost(int availableItemCount) {
            return Math.min(AVAILABILITY_CAP, Math.max(availableItemCount, 0));
        }

        private int recencyBonus(int eventIndex) {
            if (eventIndex < 5) {
                return RECENT_EVENT_BONUS_FIRST_FIVE;
            }
            if (eventIndex < 10) {
                return RECENT_EVENT_BONUS_NEXT_FIVE;
            }
            return 0;
        }
    }

    private static final class PreferenceProfile {
        private final Map<String, Integer> styles = new HashMap<>();
        private final Map<String, Integer> occasions = new HashMap<>();
        private final Map<String, Integer> seasons = new HashMap<>();
        private final Map<String, Integer> colors = new HashMap<>();
        private final Map<String, Integer> categories = new HashMap<>();
        private final Map<String, Integer> tags = new HashMap<>();
        private final Map<String, Integer> keywords = new HashMap<>();
        private final Map<Long, Integer> costumes = new HashMap<>();

        boolean isEmpty() {
            return styles.isEmpty()
                    && occasions.isEmpty()
                    && seasons.isEmpty()
                    && colors.isEmpty()
                    && categories.isEmpty()
                    && tags.isEmpty()
                    && keywords.isEmpty()
                    && costumes.isEmpty();
        }

        Map<String, Integer> styles() {
            return styles;
        }

        Map<String, Integer> occasions() {
            return occasions;
        }

        Map<String, Integer> seasons() {
            return seasons;
        }

        Map<String, Integer> colors() {
            return colors;
        }

        Map<String, Integer> categories() {
            return categories;
        }

        void addCostumeInterest(Long costumeId, int score) {
            if (costumeId == null || score <= 0) {
                return;
            }

            costumes.merge(costumeId, score, Integer::sum);
        }

        int costumeScore(Long costumeId) {
            if (costumeId == null) {
                return 0;
            }
            return costumes.getOrDefault(costumeId, 0);
        }

        void addCostumeMetadata(Costume costume, int weight) {
            if (costume == null || weight <= 0) {
                return;
            }

            CostumeMetadataDTO metadata = CostumeMetadataDTO.fromEntity(costume.getMetadata());
            add(styles, metadata != null ? metadata.style() : null, weight);
            add(occasions, metadata != null ? metadata.occasion() : null, weight);
            add(seasons, metadata != null ? metadata.season() : null, weight);
            add(colors, metadata != null ? metadata.color() : null, weight);
            add(categories, costume.getCategory() != null ? costume.getCategory().getName() : null, weight);

            if (metadata != null && metadata.tags() != null) {
                for (String tag : metadata.tags()) {
                    add(tags, tag, weight);
                }
            }
        }

        void addMetadata(Map<String, Object> metadataMap, int weight) {
            if (metadataMap == null || metadataMap.isEmpty() || weight <= 0) {
                return;
            }

            add(styles, readString(metadataMap.get("style")), weight);
            add(occasions, readString(metadataMap.get("occasion")), weight);
            add(seasons, readString(metadataMap.get("season")), weight);
            add(colors, readString(metadataMap.get("color")), weight);
            add(categories, readString(metadataMap.get("category")), weight);
            addCollection(tags, metadataMap.get("tags"), weight);
        }

        void addKeywords(String queryText, int weight) {
            String normalizedQuery = normalizeStatic(queryText);
            if (normalizedQuery == null || weight <= 0) {
                return;
            }

            for (String token : normalizedQuery.split("\\s+")) {
                if (token.length() >= 3) {
                    keywords.merge(token, weight, Integer::sum);
                }
            }
        }

        int attributeScore(Map<String, Integer> profileScores, String value, int multiplier) {
            String normalizedValue = normalizeStatic(value);
            if (normalizedValue == null) {
                return 0;
            }

            return profileScores.getOrDefault(normalizedValue, 0) * multiplier;
        }

        int tagScore(List<String> candidateTags, int unit, int cap) {
            if (candidateTags == null || candidateTags.isEmpty()) {
                return 0;
            }

            int score = 0;
            for (String tag : candidateTags) {
                String normalizedTag = normalizeStatic(tag);
                if (normalizedTag != null) {
                    score += tags.getOrDefault(normalizedTag, 0) * unit;
                }
            }
            return Math.min(cap, score);
        }

        int keywordScore(Costume candidate, int unit, int cap) {
            if (keywords.isEmpty() || candidate == null) {
                return 0;
            }

            String searchableText = normalizeStatic(
                    String.join(" ",
                            safe(candidate.getName()),
                            safe(candidate.getDescription()),
                            candidate.getCategory() != null ? safe(candidate.getCategory().getName()) : "",
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getStyle() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getOccasion() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getSeason() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getColor() : null),
                            candidate.getMetadata() != null ? String.join(" ", candidate.getMetadata().getTags())
                                    : ""));

            if (searchableText == null) {
                return 0;
            }

            int score = 0;
            for (Map.Entry<String, Integer> entry : keywords.entrySet()) {
                if (searchableText.contains(entry.getKey())) {
                    score += entry.getValue() * unit;
                }
            }
            return Math.min(cap, score);
        }

        private void add(Map<String, Integer> profileScores, String value, int weight) {
            String normalizedValue = normalizeStatic(value);
            if (normalizedValue == null) {
                return;
            }

            profileScores.merge(normalizedValue, weight, Integer::sum);
        }

        private void addCollection(Map<String, Integer> profileScores, Object rawValue, int weight) {
            if (rawValue instanceof Collection<?> collection) {
                for (Object value : collection) {
                    add(profileScores, value != null ? value.toString() : null, weight);
                }
                return;
            }

            if (rawValue instanceof String text) {
                for (String token : text.split(",")) {
                    add(profileScores, token, weight);
                }
            }
        }

        private static String readString(Object value) {
            return value != null ? value.toString() : null;
        }

        private static String safe(String value) {
            return value == null ? "" : value;
        }

        private static String normalizeStatic(String value) {
            if (value == null) {
                return null;
            }

            String trimmed = value.trim().toLowerCase(Locale.ROOT);
            return trimmed.isEmpty() ? null : trimmed;
        }
    }
}
