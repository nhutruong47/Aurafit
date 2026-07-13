package com.aurafit.service.impl;

import com.aurafit.dto.response.CostumeMetadataDTO;
import com.aurafit.entity.Costume;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.service.UserPreferenceSummaryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserPreferenceSummaryServiceImpl implements UserPreferenceSummaryService {

    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {
    };
    private static final int RECENT_EVENT_LIMIT = 20;
    private static final int RECENT_PRODUCT_LIMIT = 3;
    private static final String EMPTY_SENTINEL = "__EMPTY__";

    private final UserInteractionEventRepository userInteractionEventRepository;
    private final CostumeRepository costumeRepository;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;

    public UserPreferenceSummaryServiceImpl(UserInteractionEventRepository userInteractionEventRepository,
                                            CostumeRepository costumeRepository,
                                            ObjectMapper objectMapper,
                                            CacheManager cacheManager) {
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.costumeRepository = costumeRepository;
        this.objectMapper = objectMapper;
        this.cacheManager = cacheManager;
    }

    @Override
    public String summarize(String userId, String guestSessionId) {
        String normalizedUserId = normalize(userId);
        String normalizedGuestSessionId = normalize(guestSessionId);
        if (normalizedUserId == null && normalizedGuestSessionId == null) {
            return null;
        }

        Cache cache = cacheManager != null ? cacheManager.getCache(CACHE_NAME) : null;
        String cacheKey = buildCacheKey(normalizedUserId, normalizedGuestSessionId);
        if (cache != null) {
            Cache.ValueWrapper wrapper = cache.get(cacheKey);
            if (wrapper != null) {
                Object cachedValue = wrapper.get();
                if (EMPTY_SENTINEL.equals(cachedValue)) {
                    return null;
                }
                return cachedValue instanceof String text && !text.isBlank() ? text : null;
            }
        }

        String summary = buildSummary(loadRecentEvents(normalizedUserId, normalizedGuestSessionId));
        if (cache != null) {
            cache.put(cacheKey, summary == null ? EMPTY_SENTINEL : summary);
        }
        return summary;
    }

    private List<UserInteractionEvent> loadRecentEvents(String userId, String guestSessionId) {
        List<UserInteractionEvent> mergedEvents = new ArrayList<>();
        Set<Long> seenEventIds = new LinkedHashSet<>();

        Long parsedUserId = parseLong(userId);
        if (parsedUserId != null) {
            for (UserInteractionEvent event : userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(parsedUserId)) {
                if (event.getId() == null || seenEventIds.add(event.getId())) {
                    mergedEvents.add(event);
                }
            }
        }

        if (guestSessionId != null) {
            for (UserInteractionEvent event : userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc(guestSessionId)) {
                if (event.getId() == null || seenEventIds.add(event.getId())) {
                    mergedEvents.add(event);
                }
            }
        }

        return mergedEvents.stream()
                .sorted(Comparator.comparing(
                        UserInteractionEvent::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECENT_EVENT_LIMIT)
                .toList();
    }

    private String buildSummary(List<UserInteractionEvent> recentEvents) {
        if (recentEvents == null || recentEvents.isEmpty()) {
            return null;
        }

        Map<Long, Costume> costumesById = loadCostumesById(recentEvents);
        SignalCounter styles = new SignalCounter();
        SignalCounter occasions = new SignalCounter();
        SignalCounter colors = new SignalCounter();
        LinkedHashSet<String> recentProductNames = new LinkedHashSet<>();

        for (UserInteractionEvent event : recentEvents) {
            Long costumeId = event.getTargetType() == InteractionTargetType.COSTUME
                    ? parseLong(event.getTargetId())
                    : null;
            Costume costume = costumeId == null ? null : costumesById.get(costumeId);
            CostumeMetadataDTO costumeMetadata = costume != null ? CostumeMetadataDTO.fromEntity(costume.getMetadata()) : null;
            Map<String, Object> metadataMap = parseMetadataMap(event.getMetadataJson());

            styles.add(firstNonBlank(
                    readMetadataString(metadataMap.get("style")),
                    costumeMetadata != null ? costumeMetadata.style() : null
            ));
            occasions.add(firstNonBlank(
                    readMetadataString(metadataMap.get("occasion")),
                    costumeMetadata != null ? costumeMetadata.occasion() : null
            ));
            colors.add(firstNonBlank(
                    readMetadataString(metadataMap.get("color")),
                    costumeMetadata != null ? costumeMetadata.color() : null
            ));

            if (costume != null && shouldIncludeRecentProduct(event)) {
                recentProductNames.add(costume.getName());
            }
        }

        List<String> sentences = new ArrayList<>();
        List<String> preferenceParts = new ArrayList<>();
        appendPreferencePart(preferenceParts, "phong cách", styles.topLabel());
        appendPreferencePart(preferenceParts, "dịp", occasions.topLabel());
        appendPreferencePart(preferenceParts, "màu", colors.topLabel());

        if (!preferenceParts.isEmpty()) {
            sentences.add("User thường quan tâm đồ " + String.join(", ", preferenceParts) + ".");
        }
        if (!recentProductNames.isEmpty()) {
            sentences.add("Gần đây đã quan tâm: " + recentProductNames.stream()
                    .limit(RECENT_PRODUCT_LIMIT)
                    .collect(Collectors.joining(", ")) + ".");
        }

        // TODO: Add an optional LLM-based event summarizer once the extra per-session latency/cost is approved.
        return sentences.isEmpty() ? null : String.join(" ", sentences);
    }

    private Map<Long, Costume> loadCostumesById(List<UserInteractionEvent> recentEvents) {
        LinkedHashSet<Long> costumeIds = new LinkedHashSet<>();
        for (UserInteractionEvent event : recentEvents) {
            if (event.getTargetType() != InteractionTargetType.COSTUME) {
                continue;
            }

            Long costumeId = parseLong(event.getTargetId());
            if (costumeId != null) {
                costumeIds.add(costumeId);
            }
        }

        if (costumeIds.isEmpty()) {
            return Map.of();
        }

        return costumeRepository.findAllById(costumeIds).stream()
                .filter(costume -> costume.getId() != null)
                .collect(Collectors.toMap(Costume::getId, costume -> costume, (left, right) -> left, LinkedHashMap::new));
    }

    private Map<String, Object> parseMetadataMap(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(metadataJson.trim(), METADATA_TYPE);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private boolean shouldIncludeRecentProduct(UserInteractionEvent event) {
        return event != null
                && event.getTargetType() == InteractionTargetType.COSTUME
                && switch (event.getEventType()) {
                    case VIEW_PRODUCT, ADD_TO_CART, RENT, RECOMMENDATION_CLICK, WISHLIST_ADD -> true;
                    default -> false;
                };
    }

    private void appendPreferencePart(List<String> parts, String label, String value) {
        String normalizedLabel = readMetadataString(label);
        String normalizedValue = readMetadataString(value);
        if (normalizedLabel == null || normalizedValue == null) {
            return;
        }

        parts.add(normalizedLabel + " " + normalizedValue);
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }

        for (String value : values) {
            String normalizedValue = readMetadataString(value);
            if (normalizedValue != null) {
                return normalizedValue;
            }
        }

        return null;
    }

    private String buildCacheKey(String userId, String guestSessionId) {
        return (userId == null ? "" : userId) + "::" + (guestSessionId == null ? "" : guestSessionId);
    }

    private Long parseLong(String value) {
        String normalizedValue = normalize(value);
        if (normalizedValue == null) {
            return null;
        }

        try {
            return Long.parseLong(normalizedValue);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String readMetadataString(Object value) {
        if (value == null) {
            return null;
        }

        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private static final class SignalCounter {
        private final Map<String, Integer> counts = new LinkedHashMap<>();
        private final Map<String, String> labels = new LinkedHashMap<>();

        void add(String value) {
            if (value == null || value.isBlank()) {
                return;
            }

            String normalizedValue = value.trim().toLowerCase(Locale.ROOT);
            counts.merge(normalizedValue, 1, Integer::sum);
            labels.putIfAbsent(normalizedValue, value.trim());
        }

        String topLabel() {
            return counts.entrySet().stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .map(entry -> labels.get(entry.getKey()))
                    .findFirst()
                    .orElse(null);
        }
    }
}
