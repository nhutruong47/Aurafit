package com.aurafit.service.stylist.impl;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.repository.ProductAiMetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

@Service
public class MetadataTagResolver {

    private static final double SIMILARITY_THRESHOLD = 0.82D;
    private static final double TOKEN_PHRASE_MATCH_SCORE = 0.86D;
    private static final long CACHE_TTL_NANOS = Duration.ofMinutes(5).toNanos();

    private final ProductAiMetadataRepository productAiMetadataRepository;
    private final Object cacheLock = new Object();

    private volatile TagCatalog cachedCatalog;
    private volatile long cacheExpiresAtNanos;

    public MetadataTagResolver(ProductAiMetadataRepository productAiMetadataRepository) {
        this.productAiMetadataRepository = productAiMetadataRepository;
    }

    public StylistFilterCriteria resolve(StylistFilterCriteria rawIntent) {
        StylistFilterCriteria safeIntent = rawIntent == null
                ? StylistFilterCriteria.empty()
                : rawIntent;
        if (!hasResolvableValues(safeIntent)) {
            return safeIntent;
        }

        TagCatalog catalog = getTagCatalog();
        return new StylistFilterCriteria(
                safeIntent.category(),
                safeIntent.requestedItem(),
                resolveValue(safeIntent.style(), catalog.styleTags()),
                resolveValue(safeIntent.occasion(), catalog.occasionTags()),
                resolveValue(safeIntent.season(), catalog.seasonTags()),
                resolveValue(safeIntent.color(), catalog.colorTags()),
                resolveValue(safeIntent.gender(), catalog.genderTags()),
                safeIntent.tags(),
                safeIntent.minBudget(),
                safeIntent.maxBudget()
        );
    }

    private boolean hasResolvableValues(StylistFilterCriteria intent) {
        return StringUtils.hasText(intent.style())
                || StringUtils.hasText(intent.occasion())
                || StringUtils.hasText(intent.season())
                || StringUtils.hasText(intent.color())
                || StringUtils.hasText(intent.gender());
    }

    private TagCatalog getTagCatalog() {
        long now = System.nanoTime();
        TagCatalog current = cachedCatalog;
        if (current != null && now < cacheExpiresAtNanos) {
            return current;
        }

        synchronized (cacheLock) {
            now = System.nanoTime();
            current = cachedCatalog;
            if (current == null || now >= cacheExpiresAtNanos) {
                current = loadTagCatalog();
                cachedCatalog = current;
                cacheExpiresAtNanos = now + CACHE_TTL_NANOS;
            }
            return current;
        }
    }

    private TagCatalog loadTagCatalog() {
        List<ProductAiMetadata> metadataRows = productAiMetadataRepository.findAll();
        return new TagCatalog(
                distinctTags(metadataRows, ProductAiMetadata::getStyleTags),
                distinctTags(metadataRows, ProductAiMetadata::getOccasionTags),
                distinctTags(metadataRows, ProductAiMetadata::getSeasonTags),
                distinctTags(metadataRows, ProductAiMetadata::getColorTags),
                distinctTags(metadataRows, ProductAiMetadata::getGenderTags)
        );
    }

    private List<String> distinctTags(
            List<ProductAiMetadata> metadataRows,
            Function<ProductAiMetadata, List<String>> tagExtractor
    ) {
        if (metadataRows == null || metadataRows.isEmpty()) {
            return List.of();
        }

        Map<String, String> tagsByNormalizedValue = new LinkedHashMap<>();
        metadataRows.stream()
                .map(tagExtractor)
                .filter(tags -> tags != null && !tags.isEmpty())
                .flatMap(List::stream)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .forEach(tag -> tagsByNormalizedValue.putIfAbsent(normalize(tag), tag));
        return List.copyOf(tagsByNormalizedValue.values());
    }

    private String resolveValue(String rawValue, List<String> canonicalTags) {
        if (!StringUtils.hasText(rawValue) || canonicalTags == null || canonicalTags.isEmpty()) {
            return rawValue;
        }

        String normalizedRawValue = normalize(rawValue);
        String bestMatch = null;
        double bestScore = -1D;

        for (String canonicalTag : canonicalTags) {
            double score = similarity(normalizedRawValue, normalize(canonicalTag));
            if (score > bestScore) {
                bestScore = score;
                bestMatch = canonicalTag;
            }
        }

        return bestScore >= SIMILARITY_THRESHOLD ? bestMatch : rawValue;
    }

    private double similarity(String left, String right) {
        if (!StringUtils.hasText(left) || !StringUtils.hasText(right)) {
            return 0D;
        }
        if (left.equals(right)) {
            return 1D;
        }

        double editSimilarity = 1D - ((double) levenshteinDistance(left, right)
                / Math.max(left.length(), right.length()));
        double tokenSimilarity = tokenJaccardSimilarity(left, right);
        double phraseSimilarity = containsTokenPhrase(left, right)
                ? TOKEN_PHRASE_MATCH_SCORE
                : 0D;
        return Math.max(editSimilarity, Math.max(tokenSimilarity, phraseSimilarity));
    }

    private double tokenJaccardSimilarity(String left, String right) {
        Set<String> leftTokens = new LinkedHashSet<>(Arrays.asList(left.split("\\s+")));
        Set<String> rightTokens = new LinkedHashSet<>(Arrays.asList(right.split("\\s+")));
        Set<String> intersection = new LinkedHashSet<>(leftTokens);
        intersection.retainAll(rightTokens);
        Set<String> union = new LinkedHashSet<>(leftTokens);
        union.addAll(rightTokens);
        return union.isEmpty() ? 0D : (double) intersection.size() / union.size();
    }

    private boolean containsTokenPhrase(String left, String right) {
        String paddedLeft = " " + left + " ";
        String paddedRight = " " + right + " ";
        return paddedLeft.contains(paddedRight) || paddedRight.contains(paddedLeft);
    }

    private int levenshteinDistance(String left, String right) {
        int[] previous = new int[right.length() + 1];
        int[] current = new int[right.length() + 1];
        for (int column = 0; column <= right.length(); column++) {
            previous[column] = column;
        }

        for (int row = 1; row <= left.length(); row++) {
            current[0] = row;
            for (int column = 1; column <= right.length(); column++) {
                int substitutionCost = left.charAt(row - 1) == right.charAt(column - 1) ? 0 : 1;
                current[column] = Math.min(
                        Math.min(current[column - 1] + 1, previous[column] + 1),
                        previous[column - 1] + substitutionCost
                );
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[right.length()];
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

    private record TagCatalog(
            List<String> styleTags,
            List<String> occasionTags,
            List<String> seasonTags,
            List<String> colorTags,
            List<String> genderTags
    ) {
    }
}
