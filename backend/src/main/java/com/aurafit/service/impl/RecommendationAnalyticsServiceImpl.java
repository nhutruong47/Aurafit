package com.aurafit.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.dto.response.RecommendationAnalyticsDTO;
import com.aurafit.entity.Costume;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.service.RecommendationAnalyticsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class RecommendationAnalyticsServiceImpl implements RecommendationAnalyticsService {

    private static final int MIN_PERIOD_DAYS = 1;
    private static final int MAX_PERIOD_DAYS = 90;
    private static final List<String> DEFAULT_SLOTS = List.of(
            "homepage_personalized",
            "similar_products",
            "ai_stylist_chat"
    );
    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {
    };

    private final UserInteractionEventRepository userInteractionEventRepository;
    private final CostumeRepository costumeRepository;
    private final ObjectMapper objectMapper;

    public RecommendationAnalyticsServiceImpl(UserInteractionEventRepository userInteractionEventRepository,
                                              CostumeRepository costumeRepository,
                                              ObjectMapper objectMapper) {
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.costumeRepository = costumeRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public RecommendationAnalyticsDTO getAnalytics(int days) {
        int normalizedDays = Math.max(MIN_PERIOD_DAYS, Math.min(days, MAX_PERIOD_DAYS));
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(normalizedDays - 1L);
        LocalDateTime startAt = startDate.atStartOfDay();

        List<UserInteractionEvent> events = userInteractionEventRepository.findByCreatedAtGreaterThanEqualOrderByCreatedAtAsc(startAt);
        AnalyticsAccumulator analytics = new AnalyticsAccumulator(startDate, endDate);

        for (UserInteractionEvent event : events) {
            analytics.accept(event, parseMetadata(event.getMetadataJson()));
        }

        return analytics.toResponse(
                normalizedDays,
                resolveCostumeNames(analytics.topClickedCostumeCounts()),
                LocalDateTime.now()
        );
    }

    private Map<Long, String> resolveCostumeNames(Map<Long, Integer> topClickedCostumeCounts) {
        if (topClickedCostumeCounts.isEmpty()) {
            return Map.of();
        }

        List<Long> costumeIds = new ArrayList<>(topClickedCostumeCounts.keySet());
        Map<Long, String> costumeNamesById = new HashMap<>();
        for (Costume costume : costumeRepository.findAllById(costumeIds)) {
            if (costume.getId() != null) {
                costumeNamesById.put(costume.getId(), costume.getName());
            }
        }
        return costumeNamesById;
    }

    private Map<String, Object> parseMetadata(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(metadataJson.trim(), METADATA_TYPE);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private static String normalizeSlot(Map<String, Object> metadata) {
        String slot = readString(metadata.get("slot"));
        if (slot != null) {
            return slot.trim().toLowerCase(Locale.ROOT);
        }

        String source = readString(metadata.get("source"));
        if (source != null && "ai_stylist".equals(source.trim().toLowerCase(Locale.ROOT))) {
            return "ai_stylist_chat";
        }

        return "unknown";
    }

    private static boolean hasAiStylistAttribution(Map<String, Object> metadata) {
        Object rawAttribution = metadata.get("aiStylistAttribution");
        if (rawAttribution instanceof Map<?, ?> attributionMap) {
            String source = readString(attributionMap.get("source"));
            return source != null && "ai_stylist".equals(source.trim().toLowerCase(Locale.ROOT));
        }
        return false;
    }

    private static String readString(Object value) {
        return value != null ? value.toString() : null;
    }

    private static double ratioPercent(int numerator, int denominator) {
        if (denominator <= 0) {
            return 0D;
        }
        return Math.round((numerator * 10000.0D) / denominator) / 100.0D;
    }

    private static final class AnalyticsAccumulator {
        private final LocalDate startDate;
        private final LocalDate endDate;
        private final LinkedHashMap<LocalDate, DailyAccumulator> dailyAccumulators = new LinkedHashMap<>();
        private final LinkedHashMap<String, SlotAccumulator> slotAccumulators = new LinkedHashMap<>();
        private final Map<Long, Integer> topClickedCostumeCounts = new HashMap<>();

        private int totalInteractions;
        private int productViews;
        private int searches;
        private int recommendationImpressions;
        private int recommendationClicks;
        private int addToCarts;
        private int rents;

        private int aiSessionsStarted;
        private int aiUserMessages;
        private int aiAssistantMessages;
        private int aiRecommendationImpressions;
        private int aiRecommendationClicks;
        private int aiAttributedAddToCarts;
        private int aiAttributedRents;

        private AnalyticsAccumulator(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
            LocalDate cursor = startDate;
            while (!cursor.isAfter(endDate)) {
                dailyAccumulators.put(cursor, new DailyAccumulator(cursor));
                cursor = cursor.plusDays(1);
            }
            for (String slot : DEFAULT_SLOTS) {
                slotAccumulators.put(slot, new SlotAccumulator(slot));
            }
        }

        void accept(UserInteractionEvent event, Map<String, Object> metadata) {
            if (event == null || event.getCreatedAt() == null) {
                return;
            }

            totalInteractions++;
            DailyAccumulator daily = dailyAccumulators.get(event.getCreatedAt().toLocalDate());
            String slot = normalizeSlot(metadata);
            SlotAccumulator slotAccumulator = slotAccumulators.computeIfAbsent(slot, SlotAccumulator::new);

            switch (event.getEventType()) {
                case VIEW_PRODUCT -> productViews++;
                case SEARCH -> searches++;
                case CHAT_QUERY -> {
                    searches++;
                    if ("ai_stylist_chat".equals(slot)) {
                        aiUserMessages++;
                        if (daily != null) {
                            daily.aiChatQueries++;
                        }
                    }
                }
                case ADD_TO_CART -> {
                    addToCarts++;
                    if (hasAiStylistAttribution(metadata) || "ai_stylist_chat".equals(slot)) {
                        aiAttributedAddToCarts++;
                    }
                }
                case RENT -> {
                    rents++;
                    if (hasAiStylistAttribution(metadata)) {
                        aiAttributedRents++;
                        if (daily != null) {
                            daily.aiAttributedRents++;
                        }
                    }
                }
                case AI_CHAT_SESSION_START -> aiSessionsStarted++;
                case AI_CHAT_ASSISTANT_MESSAGE -> aiAssistantMessages++;
                case RECOMMENDATION_IMPRESSION -> {
                    recommendationImpressions++;
                    slotAccumulator.impressions++;
                    if (daily != null) {
                        daily.recommendationImpressions++;
                    }
                    if ("ai_stylist_chat".equals(slot)) {
                        aiRecommendationImpressions++;
                    }
                }
                case RECOMMENDATION_CLICK -> {
                    recommendationClicks++;
                    slotAccumulator.clicks++;
                    if (daily != null) {
                        daily.recommendationClicks++;
                    }
                    if ("ai_stylist_chat".equals(slot)) {
                        aiRecommendationClicks++;
                    }
                    Long costumeId = parseLong(event.getTargetId());
                    if (costumeId != null) {
                        topClickedCostumeCounts.merge(costumeId, 1, Integer::sum);
                    }
                }
                default -> {
                }
            }
        }

        Map<Long, Integer> topClickedCostumeCounts() {
            return topClickedCostumeCounts;
        }

        RecommendationAnalyticsDTO toResponse(int periodDays,
                                              Map<Long, String> costumeNamesById,
                                              LocalDateTime generatedAt) {
            RecommendationAnalyticsDTO.Overview overview = new RecommendationAnalyticsDTO.Overview(
                    totalInteractions,
                    productViews,
                    searches,
                    recommendationImpressions,
                    recommendationClicks,
                    ratioPercent(recommendationClicks, recommendationImpressions),
                    addToCarts,
                    rents
            );

            List<RecommendationAnalyticsDTO.SlotPerformance> slotPerformance = slotAccumulators.values().stream()
                    .sorted(Comparator.comparingInt(SlotAccumulator::impressions).reversed()
                            .thenComparing(SlotAccumulator::slot))
                    .map(slot -> new RecommendationAnalyticsDTO.SlotPerformance(
                            slot.slot(),
                            slot.impressions(),
                            slot.clicks(),
                            ratioPercent(slot.clicks(), slot.impressions())
                    ))
                    .toList();

            RecommendationAnalyticsDTO.AiStylistPerformance aiStylist = new RecommendationAnalyticsDTO.AiStylistPerformance(
                    aiSessionsStarted,
                    aiUserMessages,
                    aiAssistantMessages,
                    aiRecommendationImpressions,
                    aiRecommendationClicks,
                    ratioPercent(aiRecommendationClicks, aiRecommendationImpressions),
                    aiAttributedAddToCarts,
                    aiAttributedRents
            );

            List<RecommendationAnalyticsDTO.TopCostume> topClickedCostumes = topClickedCostumeCounts.entrySet().stream()
                    .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed()
                            .thenComparing(Map.Entry.comparingByKey(Comparator.reverseOrder())))
                    .limit(5)
                    .map(entry -> new RecommendationAnalyticsDTO.TopCostume(
                            entry.getKey(),
                            costumeNamesById.getOrDefault(entry.getKey(), "Costume #" + entry.getKey()),
                            entry.getValue()
                    ))
                    .toList();

            List<RecommendationAnalyticsDTO.DailyPerformance> dailyPerformance = dailyAccumulators.values().stream()
                    .map(day -> new RecommendationAnalyticsDTO.DailyPerformance(
                            day.date().format(DateTimeFormatter.ISO_LOCAL_DATE),
                            day.recommendationImpressions(),
                            day.recommendationClicks(),
                            day.aiChatQueries(),
                            day.aiAttributedRents()
                    ))
                    .toList();

            return new RecommendationAnalyticsDTO(
                    periodDays,
                    startDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
                    endDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
                    overview,
                    slotPerformance,
                    aiStylist,
                    topClickedCostumes,
                    dailyPerformance,
                    generatedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
        }

        private Long parseLong(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            try {
                return Long.parseLong(value.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
    }

    private static final class SlotAccumulator {
        private final String slot;
        private int impressions;
        private int clicks;

        private SlotAccumulator(String slot) {
            this.slot = slot;
        }

        String slot() {
            return slot;
        }

        int impressions() {
            return impressions;
        }

        int clicks() {
            return clicks;
        }
    }

    private static final class DailyAccumulator {
        private final LocalDate date;
        private int recommendationImpressions;
        private int recommendationClicks;
        private int aiChatQueries;
        private int aiAttributedRents;

        private DailyAccumulator(LocalDate date) {
            this.date = date;
        }

        LocalDate date() {
            return date;
        }

        int recommendationImpressions() {
            return recommendationImpressions;
        }

        int recommendationClicks() {
            return recommendationClicks;
        }

        int aiChatQueries() {
            return aiChatQueries;
        }

        int aiAttributedRents() {
            return aiAttributedRents;
        }
    }
}
