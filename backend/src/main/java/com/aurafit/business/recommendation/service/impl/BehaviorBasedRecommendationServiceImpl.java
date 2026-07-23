package com.aurafit.business.recommendation.service.impl;

import com.aurafit.business.catalog.dto.response.CatalogCostumeDTO;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeMetadata;
import com.aurafit.interaction.entity.UserInteractionEvent;
import com.aurafit.business.catalog.enums.CostumeStatus;
import com.aurafit.interaction.enums.InteractionEventType;
import com.aurafit.interaction.enums.InteractionTargetType;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.business.catalog.repository.specification.CostumeSpecification;
import com.aurafit.interaction.repository.UserInteractionEventRepository;
import com.aurafit.business.recommendation.service.BehaviorBasedRecommendationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class BehaviorBasedRecommendationServiceImpl implements BehaviorBasedRecommendationService {

    private static final int DEFAULT_LIMIT = 12;
    private static final int MAX_LIMIT = 50;
    private static final int MAX_RECENT_EVENTS = 50;
    private static final int MIN_PERSONALIZED_RESULTS = 4;
    private static final int HISTORY_DAYS = 90;
    private static final int MAX_FALLBACK_CANDIDATES = 200;

    private final CostumeRepository costumeRepository;
    private final UserInteractionEventRepository interactionEventRepository;

    public BehaviorBasedRecommendationServiceImpl(CostumeRepository costumeRepository,
                                                  UserInteractionEventRepository interactionEventRepository) {
        this.costumeRepository = costumeRepository;
        this.interactionEventRepository = interactionEventRepository;
    }

    @Override
    public List<CatalogCostumeDTO> getRecommendationsForUser(Long userId, String sessionId, int limit) {
        int safeLimit = normalizeLimit(limit);
        List<UserInteractionEvent> events = findRecentEvents(userId, sessionId);
        if (events.isEmpty()) {
            return fallback(safeLimit);
        }

        List<ParsedEvent> parsedEvents = events.stream()
                .map(event -> new ParsedEvent(event, parseCostumeId(event.getTargetId())))
                .filter(parsed -> parsed.costumeId() != null)
                .toList();
        if (parsedEvents.isEmpty()) {
            return fallback(safeLimit);
        }

        List<Long> interactedCostumeIds = parsedEvents.stream()
                .map(ParsedEvent::costumeId)
                .distinct()
                .toList();
        Map<Long, Costume> interactedCostumes = new LinkedHashMap<>();
        costumeRepository.findAllByIdWithMetadata(interactedCostumeIds)
                .forEach(costume -> interactedCostumes.put(costume.getId(), costume));

        Map<Long, Double> categoryScores = new LinkedHashMap<>();
        Map<String, Double> styleScores = new LinkedHashMap<>();
        Map<String, Double> occasionScores = new LinkedHashMap<>();
        Set<Long> excludedCostumeIds = new LinkedHashSet<>();

        for (ParsedEvent parsed : parsedEvents) {
            InteractionEventType eventType = parsed.event().getEventType();
            if (eventType == InteractionEventType.RENT || eventType == InteractionEventType.ADD_TO_CART) {
                excludedCostumeIds.add(parsed.costumeId());
            }

            int weight = weightOf(eventType);
            Costume costume = interactedCostumes.get(parsed.costumeId());
            if (weight == 0 || costume == null) {
                continue;
            }

            categoryScores.merge(costume.getCategory().getId(), (double) weight, Double::sum);
            CostumeMetadata metadata = costume.getMetadata();
            if (metadata != null) {
                mergeNormalizedScore(styleScores, metadata.getStyle(), weight);
                mergeNormalizedScore(occasionScores, metadata.getOccasion(), weight);
            }
        }

        List<Long> topCategoryIds = topKeys(categoryScores, 1);
        List<String> topStyles = topKeys(styleScores, 2);
        List<String> topOccasions = topKeys(occasionScores, 2);
        if (topCategoryIds.isEmpty() && topStyles.isEmpty() && topOccasions.isEmpty()) {
            return fallback(safeLimit);
        }

        Specification<Costume> preferenceSpec = Specification
                .where(CostumeSpecification.inCategoryIds(topCategoryIds))
                .or(CostumeSpecification.hasAnyStyle(topStyles))
                .or(CostumeSpecification.hasAnyOccasion(topOccasions));
        Specification<Costume> candidateSpec = Specification
                .where(CostumeSpecification.activeAndCategoryActive())
                .and(preferenceSpec)
                .and(CostumeSpecification.excludeCostumeIds(new ArrayList<>(excludedCostumeIds)));

        List<Costume> candidates = costumeRepository.findAll(
                        candidateSpec,
                        PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "availableItemCount"))
                )
                .getContent();
        List<Costume> recommendations = loadItemsPreservingOrder(candidates);

        if (recommendations.size() < MIN_PERSONALIZED_RESULTS) {
            recommendations = fillWithFallback(recommendations, excludedCostumeIds, safeLimit);
        }

        return recommendations.stream()
                .limit(safeLimit)
                .map(CatalogCostumeDTO::fromEntity)
                .toList();
    }

    private List<UserInteractionEvent> findRecentEvents(Long userId, String sessionId) {
        LocalDateTime since = LocalDateTime.now().minusDays(HISTORY_DAYS);
        PageRequest recentEventsPage = PageRequest.of(0, MAX_RECENT_EVENTS);
        if (userId != null) {
            return interactionEventRepository.findRecentByUserAndTargetType(
                    userId,
                    InteractionTargetType.COSTUME,
                    since,
                    recentEventsPage
            );
        }
        if (StringUtils.hasText(sessionId)) {
            return interactionEventRepository.findRecentBySessionAndTargetType(
                    sessionId.trim(),
                    InteractionTargetType.COSTUME,
                    since,
                    recentEventsPage
            );
        }
        return List.of();
    }

    private List<CatalogCostumeDTO> fallback(int limit) {
        return costumeRepository.findSeasonalCostumes(
                        CostumeStatus.ACTIVE,
                        PageRequest.of(0, limit)
                )
                .stream()
                .map(CatalogCostumeDTO::fromEntity)
                .toList();
    }

    private List<Costume> fillWithFallback(List<Costume> current,
                                           Set<Long> excludedCostumeIds,
                                           int limit) {
        Map<Long, Costume> merged = new LinkedHashMap<>();
        current.forEach(costume -> merged.put(costume.getId(), costume));

        int fallbackCandidateLimit = Math.min(
                MAX_FALLBACK_CANDIDATES,
                limit + merged.size() + excludedCostumeIds.size()
        );
        List<Costume> fallbackCandidates = costumeRepository.findSeasonalCostumes(
                CostumeStatus.ACTIVE,
                PageRequest.of(0, fallbackCandidateLimit)
        );
        for (Costume fallbackCandidate : fallbackCandidates) {
            if (!excludedCostumeIds.contains(fallbackCandidate.getId())) {
                merged.putIfAbsent(fallbackCandidate.getId(), fallbackCandidate);
            }
            if (merged.size() >= limit) {
                break;
            }
        }

        return merged.values().stream().limit(limit).toList();
    }

    private List<Costume> loadItemsPreservingOrder(List<Costume> costumes) {
        if (costumes.isEmpty()) {
            return List.of();
        }

        List<Long> orderedIds = costumes.stream().map(Costume::getId).toList();
        Map<Long, Costume> byId = new LinkedHashMap<>();
        costumeRepository.findAllByIdWithItems(orderedIds)
                .forEach(costume -> byId.put(costume.getId(), costume));
        return orderedIds.stream().map(byId::get).filter(Objects::nonNull).toList();
    }

    private int weightOf(InteractionEventType eventType) {
        return switch (eventType) {
            case RENT -> 5;
            case ADD_TO_CART -> 3;
            case WISHLIST_ADD -> 2;
            case VIEW_PRODUCT -> 1;
            default -> 0;
        };
    }

    private Long parseCostumeId(String targetId) {
        if (!StringUtils.hasText(targetId)) {
            return null;
        }
        try {
            return Long.valueOf(targetId.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private void mergeNormalizedScore(Map<String, Double> scores, String value, int weight) {
        if (StringUtils.hasText(value)) {
            scores.merge(value.trim().toLowerCase(Locale.ROOT), (double) weight, Double::sum);
        }
    }

    private <T> List<T> topKeys(Map<T, Double> scores, int limit) {
        return scores.entrySet().stream()
                .sorted(Map.Entry.<T, Double>comparingByValue(Comparator.reverseOrder()))
                .limit(limit)
                .map(Map.Entry::getKey)
                .toList();
    }

    private int normalizeLimit(int requestedLimit) {
        if (requestedLimit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(requestedLimit, MAX_LIMIT);
    }

    private record ParsedEvent(UserInteractionEvent event, Long costumeId) {
    }
}
