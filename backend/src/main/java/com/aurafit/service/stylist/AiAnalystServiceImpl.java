package com.aurafit.service.stylist;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.dto.response.AiInsightResponse;
import com.aurafit.entity.AiInsight;
import com.aurafit.enums.AiInsightType;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.repository.AiInsightRepository;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AiAnalystServiceImpl implements AiAnalystService {

    private static final int TOP_LIMIT = 5;
    private static final String ANALYST_SYSTEM_PROMPT = "Bạn là chuyên gia phân tích dữ liệu thời trang, hãy đọc số liệu sau và viết nhận xét xu hướng, đề xuất hành động cho admin cửa hàng cho thuê trang phục, viết bằng tiếng Việt, dưới 300 từ";

    private final ChatMessageRepository chatMessageRepository;
    private final UserInteractionEventRepository userInteractionEventRepository;
    private final AiInsightRepository aiInsightRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public AiAnalystServiceImpl(
            ChatMessageRepository chatMessageRepository,
            UserInteractionEventRepository userInteractionEventRepository,
            AiInsightRepository aiInsightRepository,
            GeminiClient geminiClient,
            ObjectMapper objectMapper
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.aiInsightRepository = aiInsightRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public AiInsightResponse generateWeeklyInsight() {
        LocalDate periodEnd = LocalDate.now().minusDays(1);
        LocalDate periodStart = periodEnd.minusDays(6);
        LocalDateTime periodStartTime = periodStart.atStartOfDay();
        LocalDateTime periodEndExclusive = periodEnd.plusDays(1).atStartOfDay();

        WeeklyMetrics metrics = aggregateMetrics(
                periodStart,
                periodEnd,
                periodStartTime,
                periodEndExclusive
        );
        String metricsSnapshot = serializeMetrics(metrics);
        String analystInput = buildAnalystInput(metrics);

        String generatedContent = geminiClient.generateText(ANALYST_SYSTEM_PROMPT, analystInput);

        AiInsight savedInsight = aiInsightRepository.save(AiInsight.builder()
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .insightType(AiInsightType.WEEKLY_TREND)
                .content(generatedContent)
                .metricsSnapshot(metricsSnapshot)
                .build());

        return AiInsightResponse.fromEntity(savedInsight);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AiInsightResponse> getLatestInsights() {
        return aiInsightRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(AiInsightResponse::fromEntity)
                .toList();
    }

    private WeeklyMetrics aggregateMetrics(
            LocalDate periodStart,
            LocalDate periodEnd,
            LocalDateTime periodStartTime,
            LocalDateTime periodEndExclusive
    ) {
        List<String> intentJsonValues = chatMessageRepository.findIntentJsonByRoleAndPeriod(
                        ChatMessageRole.USER,
                        periodStartTime,
                        periodEndExclusive
        );
        long userChatMessageCount = chatMessageRepository
                .countByRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        ChatMessageRole.USER,
                        periodStartTime,
                        periodEndExclusive
                );

        Map<String, Long> intentCategories = new LinkedHashMap<>();
        Map<String, Long> intentStyles = new LinkedHashMap<>();
        Map<String, Long> intentOccasions = new LinkedHashMap<>();
        intentJsonValues.forEach(intentJson -> countIntentDimensions(
                intentJson,
                intentCategories,
                intentStyles,
                intentOccasions
        ));

        Map<InteractionEventType, Long> interactionCounts = aggregateInteractionCounts(
                periodStartTime,
                periodEndExclusive
        );
        InteractionCategoryMetrics interactionCategories = aggregateInteractionCategories(
                periodStartTime,
                periodEndExclusive
        );

        long totalChatSessions = chatMessageRepository.countDistinctSessionsByRoleAndPeriod(
                ChatMessageRole.USER,
                periodStartTime,
                periodEndExclusive
        );
        long recommendedChatSessions = chatMessageRepository
                .countDistinctRecommendedSessionsByRoleAndPeriod(
                        ChatMessageRole.ASSISTANT,
                        ChatMessageRole.USER,
                        periodStartTime,
                        periodEndExclusive
                );
        double recommendationConversionRate = totalChatSessions == 0
                ? 0.0
                : Math.round((recommendedChatSessions * 10000.0) / totalChatSessions) / 100.0;

        return new WeeklyMetrics(
                periodStart,
                periodEnd,
                userChatMessageCount,
                sortByCount(intentCategories),
                sortByCount(intentStyles),
                sortByCount(intentOccasions),
                interactionCounts,
                interactionCategories.searchCategories(),
                interactionCategories.viewProductCategories(),
                interactionCategories.combinedCategories(),
                totalChatSessions,
                recommendedChatSessions,
                recommendationConversionRate,
                topCounts(intentStyles, TOP_LIMIT),
                topCounts(intentOccasions, TOP_LIMIT)
        );
    }

    private void countIntentDimensions(
            String intentJson,
            Map<String, Long> categories,
            Map<String, Long> styles,
            Map<String, Long> occasions
    ) {
        if (!StringUtils.hasText(intentJson)) {
            return;
        }

        try {
            StylistFilterCriteria criteria = objectMapper.readValue(intentJson, StylistFilterCriteria.class);
            increment(categories, criteria.category());
            increment(styles, criteria.style());
            increment(occasions, criteria.occasion());
        } catch (JsonProcessingException | IllegalArgumentException ignored) {
            // Ignore one malformed historical intent without failing the weekly batch.
        }
    }

    private Map<InteractionEventType, Long> aggregateInteractionCounts(
            LocalDateTime periodStart,
            LocalDateTime periodEnd
    ) {
        Map<InteractionEventType, Long> counts = new EnumMap<>(InteractionEventType.class);
        for (InteractionEventType eventType : InteractionEventType.values()) {
            counts.put(eventType, 0L);
        }

        userInteractionEventRepository.countByEventTypeForPeriod(periodStart, periodEnd)
                .forEach(row -> counts.put((InteractionEventType) row[0], (Long) row[1]));
        return counts;
    }

    private InteractionCategoryMetrics aggregateInteractionCategories(
            LocalDateTime periodStart,
            LocalDateTime periodEnd
    ) {
        List<Object[]> relevantEvents = userInteractionEventRepository
                .findEventTypeAndMetadataForPeriod(
                        List.of(InteractionEventType.SEARCH, InteractionEventType.VIEW_PRODUCT),
                        periodStart,
                        periodEnd
                );
        Map<String, Long> searchCategories = new LinkedHashMap<>();
        Map<String, Long> viewProductCategories = new LinkedHashMap<>();
        Map<String, Long> combinedCategories = new LinkedHashMap<>();

        relevantEvents.forEach(row -> {
            InteractionEventType eventType = (InteractionEventType) row[0];
            String category = extractInteractionCategory((String) row[1]);
            if (!StringUtils.hasText(category)) {
                return;
            }

            if (eventType == InteractionEventType.SEARCH) {
                increment(searchCategories, category);
            } else if (eventType == InteractionEventType.VIEW_PRODUCT) {
                increment(viewProductCategories, category);
            }
            increment(combinedCategories, category);
        });

        return new InteractionCategoryMetrics(
                sortByCount(searchCategories),
                sortByCount(viewProductCategories),
                sortByCount(combinedCategories)
        );
    }

    private String extractInteractionCategory(String metadataJson) {
        if (!StringUtils.hasText(metadataJson)) {
            return null;
        }

        try {
            JsonNode metadata = objectMapper.readTree(metadataJson);
            return firstTextValue(metadata, "category", "categoryName", "subcategory", "categoryPath");
        } catch (JsonProcessingException | IllegalArgumentException ignored) {
            return null;
        }
    }

    private String firstTextValue(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode value = node.get(fieldName);
            if (value != null && value.isTextual() && StringUtils.hasText(value.asText())) {
                return value.asText();
            }
        }
        return null;
    }

    private void increment(Map<String, Long> counts, String value) {
        String normalized = normalizeDimension(value);
        if (normalized != null) {
            counts.merge(normalized, 1L, Long::sum);
        }
    }

    private String normalizeDimension(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private Map<String, Long> sortByCount(Map<String, Long> counts) {
        Map<String, Long> sorted = new LinkedHashMap<>();
        counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry.comparingByKey()))
                .forEach(entry -> sorted.put(entry.getKey(), entry.getValue()));
        return sorted;
    }

    private List<TrendCount> topCounts(Map<String, Long> counts, int limit) {
        return sortByCount(counts).entrySet().stream()
                .limit(limit)
                .map(entry -> new TrendCount(entry.getKey(), entry.getValue()))
                .toList();
    }

    private String serializeMetrics(WeeklyMetrics metrics) {
        try {
            return objectMapper.writeValueAsString(metrics);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize AI insight metrics.", exception);
        }
    }

    private String buildAnalystInput(WeeklyMetrics metrics) {
        return """
                - Kỳ dữ liệu: %s đến %s (7 ngày hoàn chỉnh gần nhất).
                - Tin nhắn người dùng trong chat: %d.
                - Nhu cầu theo danh mục nổi bật: %s.
                - Top 5 phong cách: %s.
                - Top 5 dịp sử dụng: %s.
                - Số tương tác theo loại: %s.
                - Danh mục được tìm kiếm nhiều: %s.
                - Danh mục được xem nhiều: %s.
                - Tổng hợp danh mục được quan tâm: %s.
                - Tín hiệu chuyển đổi recommendation: %d/%d session, tương đương %.2f%%.
                """.formatted(
                metrics.periodStart(),
                metrics.periodEnd(),
                metrics.userChatMessageCount(),
                formatTopMap(metrics.intentCategories(), TOP_LIMIT),
                formatTrendCounts(metrics.topStyles()),
                formatTrendCounts(metrics.topOccasions()),
                formatEventCounts(metrics.interactionCounts()),
                formatTopMap(metrics.searchCategoryInterest(), TOP_LIMIT),
                formatTopMap(metrics.viewProductCategoryInterest(), TOP_LIMIT),
                formatTopMap(metrics.combinedCategoryInterest(), TOP_LIMIT),
                metrics.recommendedChatSessions(),
                metrics.totalChatSessions(),
                metrics.recommendationConversionRatePercent()
        );
    }

    private String formatEventCounts(Map<InteractionEventType, Long> counts) {
        List<String> values = new ArrayList<>();
        counts.forEach((eventType, count) -> values.add(eventType.name() + "=" + count));
        return String.join(", ", values);
    }

    private String formatTopMap(Map<String, Long> counts, int limit) {
        return counts.entrySet().stream()
                .limit(limit)
                .map(entry -> entry.getKey() + " (" + entry.getValue() + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("không có dữ liệu");
    }

    private String formatTrendCounts(List<TrendCount> trends) {
        return trends.stream()
                .map(trend -> trend.value() + " (" + trend.count() + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("không có dữ liệu");
    }

    private record InteractionCategoryMetrics(
            Map<String, Long> searchCategories,
            Map<String, Long> viewProductCategories,
            Map<String, Long> combinedCategories
    ) {
    }

    private record TrendCount(String value, long count) {
    }

    private record WeeklyMetrics(
            LocalDate periodStart,
            LocalDate periodEnd,
            long userChatMessageCount,
            Map<String, Long> intentCategories,
            Map<String, Long> intentStyles,
            Map<String, Long> intentOccasions,
            Map<InteractionEventType, Long> interactionCounts,
            Map<String, Long> searchCategoryInterest,
            Map<String, Long> viewProductCategoryInterest,
            Map<String, Long> combinedCategoryInterest,
            long totalChatSessions,
            long recommendedChatSessions,
            double recommendationConversionRatePercent,
            List<TrendCount> topStyles,
            List<TrendCount> topOccasions
    ) {
    }
}
