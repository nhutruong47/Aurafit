package com.aurafit.ai.stylist.service.impl;

import com.aurafit.ai.stylist.service.StylistFilterCriteria;
import com.aurafit.business.catalog.entity.Category;
import com.aurafit.business.catalog.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StylistCategoryResolver {

    private static final int MIN_SIGNAL_TOKEN_LENGTH = 3;
    private static final Set<String> AMBIGUOUS_UNACCENTED_TOKENS = Set.of("dam");

    private final CategoryRepository categoryRepository;

    public StylistCategoryResolver(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public StylistFilterCriteria resolve(StylistFilterCriteria criteria, String userMessage) {
        StylistFilterCriteria safeCriteria = criteria == null ? StylistFilterCriteria.empty() : criteria;
        List<Category> activeCategories = categoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
        String resolvedCategoryPath = resolveCategoryPath(safeCriteria, userMessage, activeCategories);

        return new StylistFilterCriteria(
                resolvedCategoryPath,
                safeCriteria.requestedItem(),
                safeCriteria.style(),
                safeCriteria.occasion(),
                safeCriteria.season(),
                safeCriteria.color(),
                safeCriteria.gender(),
                safeCriteria.tags(),
                safeCriteria.minBudget(),
                safeCriteria.maxBudget()
        );
    }

    private String resolveCategoryPath(
            StylistFilterCriteria criteria,
            String userMessage,
            List<Category> activeCategories
    ) {
        if (activeCategories == null || activeCategories.isEmpty()) {
            return null;
        }

        Map<String, Category> categoriesByPath = activeCategories.stream()
                .filter(category -> StringUtils.hasText(category.getPath()))
                .collect(Collectors.toMap(
                        category -> normalize(category.getPath()),
                        Function.identity(),
                        (left, right) -> left
                ));

        String requestedCategory = normalize(criteria.category());
        Category baseCategory = categoriesByPath.get(requestedCategory);
        if (baseCategory == null && StringUtils.hasText(requestedCategory)) {
            baseCategory = activeCategories.stream()
                    .filter(category -> requestedCategory.equals(normalize(category.getSlug()))
                            || requestedCategory.equals(normalize(category.getName())))
                    .min(Comparator.comparingInt(category -> pathDepth(category.getPath())))
                    .orElse(null);
        }

        String basePath = baseCategory == null ? null : baseCategory.getPath();
        List<Category> scopedCategories = activeCategories.stream()
                .filter(category -> StringUtils.hasText(category.getPath()))
                .filter(category -> basePath == null
                        || category.getPath().equals(basePath)
                        || category.getPath().startsWith(basePath + "/"))
                .toList();

        for (LinkedHashSet<String> signalTokens : buildPrioritySignalGroups(criteria, userMessage)) {
            List<Category> matchedCategories = scopedCategories.stream()
                    .filter(category -> matchesAnySignal(category, signalTokens))
                    .toList();
            String commonPath = deepestCommonCategoryPath(matchedCategories, categoriesByPath);

            if (baseCategory != null
                    && StringUtils.hasText(commonPath)
                    && pathDepth(commonPath) > pathDepth(basePath)) {
                return categoriesByPath.get(normalize(commonPath)).getPath();
            }
            if (baseCategory == null && StringUtils.hasText(commonPath) && pathDepth(commonPath) > 1) {
                return categoriesByPath.get(normalize(commonPath)).getPath();
            }
        }

        return baseCategory == null ? null : baseCategory.getPath();
    }

    private List<LinkedHashSet<String>> buildPrioritySignalGroups(
            StylistFilterCriteria criteria,
            String userMessage
    ) {
        List<LinkedHashSet<String>> groups = new java.util.ArrayList<>();
        if (criteria.tags() != null) {
            addSignalGroup(groups, criteria.tags());
        }
        addSignalGroup(groups, Arrays.asList(
                criteria.requestedItem(),
                criteria.style(),
                criteria.occasion(),
                criteria.season(),
                criteria.color(),
                criteria.gender()
        ));
        addSignalGroup(groups, List.of(userMessage));
        return groups;
    }

    private void addSignalGroup(List<LinkedHashSet<String>> groups, List<String> values) {
        LinkedHashSet<String> tokens = new LinkedHashSet<>();
        values.forEach(value -> addTokens(tokens, value));
        if (!tokens.isEmpty()) {
            groups.add(tokens);
        }
    }

    private void addTokens(LinkedHashSet<String> tokens, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        Arrays.stream(normalize(value).split("\\s+"))
                .filter(token -> token.length() >= MIN_SIGNAL_TOKEN_LENGTH)
                // "đám" and "đầm" both become "dam" after accent folding and
                // otherwise make a wedding request match every dress category.
                .filter(token -> !AMBIGUOUS_UNACCENTED_TOKENS.contains(token))
                .forEach(tokens::add);
    }

    private boolean matchesAnySignal(Category category, LinkedHashSet<String> signalTokens) {
        String searchableCategory = normalize(
                String.join(" ",
                        nullToEmpty(category.getName()),
                        nullToEmpty(category.getSlug()),
                        nullToEmpty(category.getPath())
                )
        );
        return signalTokens.stream().anyMatch(searchableCategory::contains);
    }

    private String deepestCommonCategoryPath(
            List<Category> categories,
            Map<String, Category> categoriesByPath
    ) {
        if (categories == null || categories.isEmpty()) {
            return null;
        }

        List<String[]> paths = categories.stream()
                .map(Category::getPath)
                .map(path -> path.split("/"))
                .toList();
        int commonLength = paths.stream().mapToInt(path -> path.length).min().orElse(0);

        for (int index = 0; index < commonLength; index++) {
            String segment = paths.getFirst()[index];
            int currentIndex = index;
            if (paths.stream().anyMatch(path -> !segment.equals(path[currentIndex]))) {
                commonLength = index;
                break;
            }
        }

        while (commonLength > 0) {
            String candidatePath = String.join("/", Arrays.copyOf(paths.getFirst(), commonLength));
            if (categoriesByPath.containsKey(normalize(candidatePath))) {
                return candidatePath;
            }
            commonLength--;
        }
        return null;
    }

    private int pathDepth(String path) {
        return StringUtils.hasText(path) ? path.split("/").length : 0;
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return Normalizer.normalize(
                        value.replace('Đ', 'D').replace('đ', 'd'),
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
