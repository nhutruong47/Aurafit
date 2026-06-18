package com.aurafit.service;

import com.aurafit.entity.Costume;
import com.aurafit.entity.InteractionLog;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.CostumeSetRepository;
import com.aurafit.repository.InteractionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CostumeService {

    private final CostumeRepository costumeRepository;
    private final CostumeSetRepository costumeSetRepository;
    private final InteractionLogRepository interactionLogRepository;

    public List<Costume> getAllCostumes() {
        return costumeRepository.findAll();
    }

    public List<Costume> getCostumesByCategory(String category) {
        return costumeRepository.findByCategoryIgnoreCase(category);
    }

    public List<Costume> getSeasonalCostumes() {
        SeasonProfile seasonProfile = getCurrentSeasonProfile();
        return costumeRepository.findAll()
                .stream()
                .sorted(Comparator.comparingInt((Costume costume) -> seasonalScore(costume, seasonProfile)).reversed())
                .toList();
    }

    public List<Costume> getRecommendedCostumes(Long userId) {
        if (userId == null) {
            return getSeasonalCostumes();
        }

        List<InteractionLog> logs = interactionLogRepository.findByUserIdAndTargetTypeOrderByCreatedAtDesc(userId, "COSTUME");
        if (logs.isEmpty()) {
            return getSeasonalCostumes();
        }

        Set<Long> costumeIds = logs.stream()
                .map(InteractionLog::getTargetId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Costume> interactedCostumes = costumeRepository.findAllById(costumeIds)
                .stream()
                .collect(Collectors.toMap(Costume::getId, costume -> costume));

        Map<String, Integer> categoryWeights = new HashMap<>();
        Map<String, Integer> subcategoryWeights = new HashMap<>();
        Map<String, Integer> tagWeights = new HashMap<>();

        logs.forEach(log -> {
            Costume costume = interactedCostumes.get(log.getTargetId());
            if (costume == null) {
                return;
            }

            int weight = actionWeight(log.getActionType());
            addWeight(categoryWeights, costume.getCategory(), weight);
            addWeight(subcategoryWeights, costume.getSubcategory(), weight);
            addWeight(tagWeights, costume.getTag(), weight);
        });

        SeasonProfile seasonProfile = getCurrentSeasonProfile();
        return costumeRepository.findAll()
                .stream()
                .sorted(Comparator
                        .comparingInt((Costume costume) -> recommendationScore(
                                costume,
                                categoryWeights,
                                subcategoryWeights,
                                tagWeights,
                                seasonProfile
                        ))
                        .reversed())
                .toList();
    }

    private int recommendationScore(
            Costume costume,
            Map<String, Integer> categoryWeights,
            Map<String, Integer> subcategoryWeights,
            Map<String, Integer> tagWeights,
            SeasonProfile seasonProfile
    ) {
        return categoryWeights.getOrDefault(costume.getCategory(), 0) * 8
                + subcategoryWeights.getOrDefault(costume.getSubcategory(), 0) * 6
                + tagWeights.getOrDefault(costume.getTag(), 0) * 10
                + seasonalScore(costume, seasonProfile)
                + (Boolean.TRUE.equals(costume.getAvailable()) ? 5 : 0);
    }

    private int seasonalScore(Costume costume, SeasonProfile seasonProfile) {
        int score = 0;
        if (seasonProfile.categories().contains(costume.getCategory())) {
            score += 35;
        }
        if (seasonProfile.tags().contains(costume.getTag())) {
            score += 20;
        }
        if (Boolean.TRUE.equals(costume.getAvailable())) {
            score += 5;
        }
        return score;
    }

    private int actionWeight(String actionType) {
        return switch (actionType == null ? "" : actionType.toUpperCase()) {
            case "PURCHASE", "ORDER_PAID" -> 5;
            case "ADD_TO_CART" -> 3;
            case "VIEW" -> 1;
            default -> 1;
        };
    }

    private void addWeight(Map<String, Integer> weights, String key, int weight) {
        if (key != null && !key.isBlank()) {
            weights.merge(key, weight, Integer::sum);
        }
    }

    private SeasonProfile getCurrentSeasonProfile() {
        int month = LocalDate.now().getMonthValue();
        if (month >= 3 && month <= 5) {
            return new SeasonProfile(List.of("Yearbook", "Events"), List.of("Vest", "Gala", "Wedding"));
        }
        if (month >= 6 && month <= 8) {
            return new SeasonProfile(List.of("Cosplay", "Yearbook", "Events"), List.of("Naruto", "One Piece", "Vest", "Gala"));
        }
        if (month >= 9 && month <= 11) {
            return new SeasonProfile(List.of("Events", "Cosplay"), List.of("Gala", "Wedding", "Fantasy", "Disney"));
        }
        return new SeasonProfile(List.of("Events", "Cosplay", "Accessories"), List.of("Tuxedo", "Vampire", "Harry Potter", "Akatsuki"));
    }

    private record SeasonProfile(List<String> categories, List<String> tags) {
    }
}
