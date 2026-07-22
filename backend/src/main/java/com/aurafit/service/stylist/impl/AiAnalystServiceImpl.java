package com.aurafit.service.stylist.impl;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.dto.response.AiInsightResponse;
import com.aurafit.dto.response.AiInsightResponse.SuggestedEvent;
import com.aurafit.entity.AiInsight;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.enums.AiCallType;
import com.aurafit.enums.AiInsightType;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.EventStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.repository.AiInsightRepository;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.EventRepository;
import com.aurafit.repository.InventoryRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.service.stylist.AiAnalystService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiAnalystServiceImpl implements AiAnalystService {

    private static final int TOP_LIMIT = 5;
    private static final Pattern SUGGESTED_EVENTS_PATTERN = Pattern.compile(
            "(?im)^\\s*SUGGESTED_EVENTS_JSON\\s*:\\s*(.*)\\s*$"
    );
    private static final String ANALYST_SYSTEM_PROMPT = """
            Bạn là chuyên gia phân tích dữ liệu thời trang, hãy đọc số liệu sau và viết nhận xét xu hướng, đề xuất hành động cho admin cửa hàng cho thuê trang phục, viết bằng tiếng Việt, dưới 300 từ.
            Sau phần nhận xét, dòng cuối bắt buộc có đúng định dạng SUGGESTED_EVENTS_JSON: [{"name":"...","reason":"...","categorySlug":"...","suggestedDiscountPercent":15,"costumeIds":[12,45]}].
            costumeIds chỉ được lấy từ danh sách sản phẩm nhu cầu cao nhưng tồn kho thấp đã cung cấp, không được bịa ID ngoài danh sách.
            Nếu không có gợi ý event phù hợp, dòng cuối phải là SUGGESTED_EVENTS_JSON: [].
            Không đặt nội dung nào sau dòng SUGGESTED_EVENTS_JSON.
            """;

    private final ChatMessageRepository chatMessageRepository;
    private final UserInteractionEventRepository userInteractionEventRepository;
    private final AiInsightRepository aiInsightRepository;
    private final CategoryRepository categoryRepository;
    private final CostumeRepository costumeRepository;
    private final InventoryRepository inventoryRepository;
    private final EventRepository eventRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;
    private final int lowStockThreshold;

    public AiAnalystServiceImpl(
            ChatMessageRepository chatMessageRepository,
            UserInteractionEventRepository userInteractionEventRepository,
            AiInsightRepository aiInsightRepository,
            CategoryRepository categoryRepository,
            CostumeRepository costumeRepository,
            InventoryRepository inventoryRepository,
            EventRepository eventRepository,
            GeminiClient geminiClient,
            ObjectMapper objectMapper,
            @Value("${ai-analyst.low-stock-threshold}") int lowStockThreshold
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.aiInsightRepository = aiInsightRepository;
        this.categoryRepository = categoryRepository;
        this.costumeRepository = costumeRepository;
        this.inventoryRepository = inventoryRepository;
        this.eventRepository = eventRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
        if (lowStockThreshold < 0) {
            throw new IllegalArgumentException("ai-analyst.low-stock-threshold must not be negative.");
        }
        this.lowStockThreshold = lowStockThreshold;
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
        List<DemandCategorySignal> highDemandCategories = resolveHighDemandCategories(metrics);
        LocalDateTime now = LocalDateTime.now();
        List<DemandCategorySignal> demandCategoriesWithoutActiveEvent =
                findDemandCategoriesWithoutActiveEvent(highDemandCategories, now);
        List<LowStockCostumeSignal> lowStockHighDemandCostumes =
                findLowStockHighDemandCostumes(highDemandCategories);
        String metricsSnapshot = serializeMetrics(metrics);
        String analystInput = buildAnalystInput(
                metrics,
                demandCategoriesWithoutActiveEvent,
                lowStockHighDemandCostumes
        );

        String rawGeneratedContent = geminiClient.generateText(
                AiCallType.INSIGHT,
                ANALYST_SYSTEM_PROMPT,
                analystInput
        );
        ParsedAnalystResponse parsedResponse = parseAnalystResponse(
                rawGeneratedContent,
                lowStockHighDemandCostumes.stream()
                        .map(LowStockCostumeSignal::costumeId)
                        .collect(Collectors.toSet())
        );

        AiInsight savedInsight = aiInsightRepository.save(AiInsight.builder()
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .insightType(AiInsightType.WEEKLY_TREND)
                .content(parsedResponse.content())
                .metricsSnapshot(metricsSnapshot)
                .suggestedEventsJson(parsedResponse.suggestedEventsJson())
                .build());

        return AiInsightResponse.fromEntity(savedInsight, parsedResponse.suggestedEvents());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AiInsightResponse> getLatestInsights() {
        return aiInsightRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(insight -> AiInsightResponse.fromEntity(
                        insight,
                        parseStoredSuggestedEvents(insight.getSuggestedEventsJson())
                ))
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
                .forEach(row -> putKnownInteractionCount(counts, row));
        return counts;
    }

    private void putKnownInteractionCount(
            Map<InteractionEventType, Long> counts,
            Object[] aggregateRow
    ) {
        if (aggregateRow == null || aggregateRow.length < 2 || !(aggregateRow[1] instanceof Number count)) {
            return;
        }

        String rawEventType = aggregateRow[0] instanceof InteractionEventType eventType
                ? eventType.name()
                : String.valueOf(aggregateRow[0]);
        try {
            counts.put(InteractionEventType.valueOf(rawEventType), count.longValue());
        } catch (IllegalArgumentException ignored) {
            // Legacy interaction types are intentionally excluded from current analytics.
        }
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

    private List<DemandCategorySignal> resolveHighDemandCategories(WeeklyMetrics metrics) {
        List<Map.Entry<String, Long>> topDemandEntries = metrics.combinedCategoryInterest()
                .entrySet()
                .stream()
                .limit(TOP_LIMIT)
                .toList();
        if (topDemandEntries.isEmpty()) {
            return List.of();
        }

        List<String> identifiers = topDemandEntries.stream()
                .map(Map.Entry::getKey)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        if (identifiers.isEmpty()) {
            return List.of();
        }

        List<Category> matchingCategories = categoryRepository.findActiveByDemandIdentifiers(identifiers);
        Set<Long> resolvedCategoryIds = new LinkedHashSet<>();
        List<DemandCategorySignal> resolved = new ArrayList<>();
        for (Map.Entry<String, Long> demandEntry : topDemandEntries) {
            Category category = findBestMatchingCategory(matchingCategories, demandEntry.getKey());
            if (category == null || !resolvedCategoryIds.add(category.getId())) {
                continue;
            }
            resolved.add(new DemandCategorySignal(
                    category.getId(),
                    category.getName(),
                    category.getSlug(),
                    category.getPath(),
                    demandEntry.getValue()
            ));
        }
        return List.copyOf(resolved);
    }

    private Category findBestMatchingCategory(List<Category> categories, String demandIdentifier) {
        if (categories == null || categories.isEmpty() || !StringUtils.hasText(demandIdentifier)) {
            return null;
        }
        String normalizedIdentifier = normalizeDimension(demandIdentifier);
        return categories.stream()
                .filter(category -> normalizedIdentifier.equals(normalizeDimension(category.getPath())))
                .findFirst()
                .orElseGet(() -> categories.stream()
                        .filter(category -> normalizedIdentifier.equals(normalizeDimension(category.getSlug())))
                        .findFirst()
                        .orElseGet(() -> categories.stream()
                                .filter(category -> normalizedIdentifier.equals(normalizeDimension(category.getName())))
                                .findFirst()
                                .orElse(null)));
    }

    private List<DemandCategorySignal> findDemandCategoriesWithoutActiveEvent(
            List<DemandCategorySignal> highDemandCategories,
            LocalDateTime now
    ) {
        if (highDemandCategories == null || highDemandCategories.isEmpty()) {
            return List.of();
        }
        return highDemandCategories.stream()
                .filter(category -> !eventRepository.existsActiveEventForCategory(
                        category.categoryId(),
                        category.categoryPath(),
                        EventStatus.ACTIVE,
                        now
                ))
                .toList();
    }

    private List<LowStockCostumeSignal> findLowStockHighDemandCostumes(
            List<DemandCategorySignal> highDemandCategories
    ) {
        if (highDemandCategories == null || highDemandCategories.isEmpty()) {
            return List.of();
        }

        List<Long> categoryIds = highDemandCategories.stream()
                .map(DemandCategorySignal::categoryId)
                .distinct()
                .toList();
        List<Costume> costumes = costumeRepository.findAllActiveByDemandCategoryIds(
                categoryIds,
                CostumeStatus.ACTIVE
        );
        if (costumes == null || costumes.isEmpty()) {
            return List.of();
        }

        List<Long> costumeIds = costumes.stream().map(Costume::getId).distinct().toList();
        Map<Long, Long> pooledCountsByCostumeId = new LinkedHashMap<>();
        List<Object[]> pooledCounts = inventoryRepository.getPooledItemCountsByCostumeIds(costumeIds);
        if (pooledCounts != null) {
            pooledCounts.forEach(row -> putPooledItemCount(pooledCountsByCostumeId, row));
        }

        return costumes.stream()
                .map(costume -> new LowStockCostumeSignal(
                        costume.getId(),
                        costume.getName(),
                        costume.getCategory().getName(),
                        costume.getCategory().getSlug(),
                        pooledCountsByCostumeId.getOrDefault(costume.getId(), 0L)
                ))
                .filter(signal -> signal.pooledItemCount() <= lowStockThreshold)
                .sorted(Comparator.comparingLong(LowStockCostumeSignal::pooledItemCount)
                        .thenComparing(LowStockCostumeSignal::costumeId))
                .toList();
    }

    private void putPooledItemCount(Map<Long, Long> counts, Object[] row) {
        if (row == null || row.length < 2 || !(row[0] instanceof Number costumeId)
                || !(row[1] instanceof Number count)) {
            return;
        }
        counts.put(costumeId.longValue(), count.longValue());
    }

    private String serializeMetrics(WeeklyMetrics metrics) {
        try {
            return objectMapper.writeValueAsString(metrics);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize AI insight metrics.", exception);
        }
    }

    private String buildAnalystInput(
            WeeklyMetrics metrics,
            List<DemandCategorySignal> demandCategoriesWithoutActiveEvent,
            List<LowStockCostumeSignal> lowStockHighDemandCostumes
    ) {
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
                - Danh mục nhu cầu cao nhưng chưa có event: %s.
                - Sản phẩm nhu cầu cao nhưng tồn kho thấp: %s.
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
                metrics.recommendationConversionRatePercent(),
                formatDemandCategorySignals(demandCategoriesWithoutActiveEvent),
                formatLowStockCostumeSignals(lowStockHighDemandCostumes)
        );
    }

    private String formatDemandCategorySignals(List<DemandCategorySignal> signals) {
        if (signals == null || signals.isEmpty()) {
            return "không có";
        }
        return signals.stream()
                .map(signal -> "%s [slug=%s, demand=%d]".formatted(
                        signal.categoryName(),
                        signal.categorySlug(),
                        signal.demandCount()
                ))
                .reduce((left, right) -> left + "; " + right)
                .orElse("không có");
    }

    private String formatLowStockCostumeSignals(List<LowStockCostumeSignal> signals) {
        if (signals == null || signals.isEmpty()) {
            return "không có";
        }
        return signals.stream()
                .map(signal -> "ID=%d, tên=%s, category=%s [slug=%s], pooledStock=%d".formatted(
                        signal.costumeId(),
                        signal.costumeName(),
                        signal.categoryName(),
                        signal.categorySlug(),
                        signal.pooledItemCount()
                ))
                .reduce((left, right) -> left + "; " + right)
                .orElse("không có");
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

    private ParsedAnalystResponse parseAnalystResponse(
            String rawResponse,
            Set<Long> allowedCostumeIds
    ) {
        String normalizedResponse = rawResponse == null ? "" : rawResponse;
        Matcher matcher = SUGGESTED_EVENTS_PATTERN.matcher(normalizedResponse);
        String suggestedEventsPayload = null;
        while (matcher.find()) {
            suggestedEventsPayload = matcher.group(1).trim();
        }
        String content = matcher.replaceAll("").trim();
        if (!StringUtils.hasText(suggestedEventsPayload)) {
            return new ParsedAnalystResponse(content, null, List.of());
        }

        try {
            List<SuggestedEvent> suggestedEvents = parseSuggestedEvents(
                    suggestedEventsPayload,
                    allowedCostumeIds
            );
            return new ParsedAnalystResponse(
                    content,
                    objectMapper.writeValueAsString(suggestedEvents),
                    suggestedEvents
            );
        } catch (JsonProcessingException | IllegalArgumentException ignored) {
            return new ParsedAnalystResponse(content, null, List.of());
        }
    }

    private List<SuggestedEvent> parseSuggestedEvents(
            String suggestedEventsJson,
            Set<Long> allowedCostumeIds
    ) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(suggestedEventsJson);
        if (root == null || !root.isArray()) {
            throw new IllegalArgumentException("Suggested events payload must be a JSON array.");
        }

        List<SuggestedEvent> suggestedEvents = new ArrayList<>();
        for (JsonNode eventNode : root) {
            if (!eventNode.isObject()) {
                throw new IllegalArgumentException("Each suggested event must be a JSON object.");
            }
            String name = requiredText(eventNode, "name");
            String reason = requiredText(eventNode, "reason");
            String categorySlug = requiredText(eventNode, "categorySlug");
            BigDecimal suggestedDiscountPercent = requiredDiscount(eventNode);
            List<Long> costumeIds = requiredCostumeIds(eventNode, allowedCostumeIds);
            suggestedEvents.add(new SuggestedEvent(
                    name,
                    reason,
                    categorySlug,
                    suggestedDiscountPercent,
                    costumeIds
            ));
        }
        return List.copyOf(suggestedEvents);
    }

    private String requiredText(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        if (value == null || !value.isTextual() || !StringUtils.hasText(value.asText())) {
            throw new IllegalArgumentException("Missing suggested event field: " + fieldName);
        }
        return value.asText().trim();
    }

    private BigDecimal requiredDiscount(JsonNode eventNode) {
        JsonNode value = eventNode.get("suggestedDiscountPercent");
        if (value == null || !value.isNumber()) {
            throw new IllegalArgumentException("suggestedDiscountPercent must be numeric.");
        }
        BigDecimal discount = value.decimalValue();
        if (discount.compareTo(BigDecimal.ZERO) <= 0
                || discount.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("suggestedDiscountPercent must be in (0, 100].");
        }
        return discount;
    }

    private List<Long> requiredCostumeIds(JsonNode eventNode, Set<Long> allowedCostumeIds) {
        JsonNode costumeIdsNode = eventNode.get("costumeIds");
        if (costumeIdsNode == null || !costumeIdsNode.isArray()) {
            throw new IllegalArgumentException("costumeIds must be an array.");
        }

        Set<Long> uniqueCostumeIds = new LinkedHashSet<>();
        for (JsonNode costumeIdNode : costumeIdsNode) {
            if (!costumeIdNode.isIntegralNumber() || !costumeIdNode.canConvertToLong()) {
                throw new IllegalArgumentException("costumeIds must contain integer IDs.");
            }
            Long costumeId = costumeIdNode.longValue();
            if (allowedCostumeIds != null && !allowedCostumeIds.contains(costumeId)) {
                throw new IllegalArgumentException("Suggested costume ID is not in the supplied low-stock list.");
            }
            uniqueCostumeIds.add(costumeId);
        }
        return List.copyOf(uniqueCostumeIds);
    }

    private List<SuggestedEvent> parseStoredSuggestedEvents(String suggestedEventsJson) {
        if (!StringUtils.hasText(suggestedEventsJson)) {
            return List.of();
        }
        try {
            return parseSuggestedEvents(suggestedEventsJson, null);
        } catch (JsonProcessingException | IllegalArgumentException ignored) {
            return List.of();
        }
    }

    private record InteractionCategoryMetrics(
            Map<String, Long> searchCategories,
            Map<String, Long> viewProductCategories,
            Map<String, Long> combinedCategories
    ) {
    }

    private record TrendCount(String value, long count) {
    }

    private record DemandCategorySignal(
            Long categoryId,
            String categoryName,
            String categorySlug,
            String categoryPath,
            long demandCount
    ) {
    }

    private record LowStockCostumeSignal(
            Long costumeId,
            String costumeName,
            String categoryName,
            String categorySlug,
            long pooledItemCount
    ) {
    }

    private record ParsedAnalystResponse(
            String content,
            String suggestedEventsJson,
            List<SuggestedEvent> suggestedEvents
    ) {
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
