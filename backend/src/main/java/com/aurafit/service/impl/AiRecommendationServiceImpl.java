package com.aurafit.service.impl;

import com.aurafit.config.AiProperties;
import com.aurafit.dto.request.OutfitComboRequest;
import com.aurafit.dto.request.RecommendationQueryRequest;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.OutfitComboResponse;
import com.aurafit.dto.response.RecommendationItemResponse;
import com.aurafit.dto.response.RecommendationResponse;
import com.aurafit.entity.Costume;
import com.aurafit.entity.FashionTrend;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.ProductEmbedding;
import com.aurafit.entity.UserPreferenceProfile;
import com.aurafit.enums.AiEmbeddingStatus;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.FashionTrendRepository;
import com.aurafit.repository.ProductAiMetadataRepository;
import com.aurafit.repository.ProductEmbeddingRepository;
import com.aurafit.service.AiDataCodec;
import com.aurafit.service.AiProviderClient;
import com.aurafit.service.AiRecommendationService;
import com.aurafit.service.RecommendationPromptBuilder;
import com.aurafit.service.UserPreferenceProfileService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AiRecommendationServiceImpl implements AiRecommendationService {

    private final ProductEmbeddingRepository productEmbeddingRepository;
    private final ProductAiMetadataRepository productAiMetadataRepository;
    private final FashionTrendRepository fashionTrendRepository;
    private final CostumeRepository costumeRepository;
    private final UserPreferenceProfileService userPreferenceProfileService;
    private final AiProviderClient aiProviderClient;
    private final AiDataCodec aiDataCodec;
    private final RecommendationPromptBuilder recommendationPromptBuilder;
    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    public AiRecommendationServiceImpl(ProductEmbeddingRepository productEmbeddingRepository,
                                       ProductAiMetadataRepository productAiMetadataRepository,
                                       FashionTrendRepository fashionTrendRepository,
                                       CostumeRepository costumeRepository,
                                       UserPreferenceProfileService userPreferenceProfileService,
                                       AiProviderClient aiProviderClient,
                                       AiDataCodec aiDataCodec,
                                       RecommendationPromptBuilder recommendationPromptBuilder,
                                       AiProperties aiProperties,
                                       ObjectMapper objectMapper) {
        this.productEmbeddingRepository = productEmbeddingRepository;
        this.productAiMetadataRepository = productAiMetadataRepository;
        this.fashionTrendRepository = fashionTrendRepository;
        this.costumeRepository = costumeRepository;
        this.userPreferenceProfileService = userPreferenceProfileService;
        this.aiProviderClient = aiProviderClient;
        this.aiDataCodec = aiDataCodec;
        this.recommendationPromptBuilder = recommendationPromptBuilder;
        this.aiProperties = aiProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public RecommendationResponse getRecommendationsForQuery(Long authenticatedUserId, RecommendationQueryRequest request) {
        UserPreferenceProfile profile = authenticatedUserId != null ? userPreferenceProfileService.getOrRecomputeProfile(authenticatedUserId) : null;
        return buildRecommendations(authenticatedUserId, profile, request, null);
    }

    @Override
    public RecommendationResponse getPersonalizedRecommendations(Long userId, Integer limit) {
        UserPreferenceProfile profile = userPreferenceProfileService.getOrRecomputeProfile(userId);
        RecommendationQueryRequest request = new RecommendationQueryRequest(
                null,
                aiDataCodec.readStringList(profile.getPreferredStylesJson()),
                aiDataCodec.readStringList(profile.getPreferredOccasionsJson()),
                aiDataCodec.readStringList(profile.getPreferredColorsJson()),
                aiDataCodec.readStringList(profile.getPreferredSizesJson()),
                aiDataCodec.readStringList(profile.getGenderAffinityJson()),
                List.of(),
                profile.getPreferredBudgetMin(),
                profile.getPreferredBudgetMax(),
                limit
        );
        return buildRecommendations(userId, profile, request, null);
    }

    @Override
    public RecommendationResponse getRecommendationPreview(Long userId, Integer limit) {
        if (userId == null) {
            return buildRecommendations(null, null, new RecommendationQueryRequest(
                    null,
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    null,
                    null,
                    limit
            ), null);
        }
        return getPersonalizedRecommendations(userId, limit);
    }

    @Override
    public OutfitComboResponse getOutfitCombos(Long authenticatedUserId, OutfitComboRequest request) {
        Costume anchor = request.anchorCostumeId() != null
                ? costumeRepository.findByIdWithCategory(request.anchorCostumeId())
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", request.anchorCostumeId()))
                : null;
        ProductAiMetadata anchorMetadata = anchor != null ? productAiMetadataRepository.findByCostumeId(anchor.getId()).orElse(null) : null;

        List<String> styleTags = anchorMetadata != null ? aiDataCodec.readStringList(anchorMetadata.getStyleTagsJson()) : List.of();
        List<String> occasionTags = request.occasionTags() != null && !request.occasionTags().isEmpty()
                ? request.occasionTags()
                : (anchorMetadata != null ? aiDataCodec.readStringList(anchorMetadata.getOccasionTagsJson()) : List.of());
        List<String> colorTags = request.colorTags() != null && !request.colorTags().isEmpty()
                ? request.colorTags()
                : (anchorMetadata != null ? aiDataCodec.readStringList(anchorMetadata.getColorTagsJson()) : List.of());

        RecommendationResponse response = buildRecommendations(
                authenticatedUserId,
                authenticatedUserId != null ? userPreferenceProfileService.getOrRecomputeProfile(authenticatedUserId) : null,
                new RecommendationQueryRequest(
                        request.prompt() != null ? request.prompt() : (anchor != null ? "goi y combo phu hop voi " + anchor.getName() : "goi y combo trang phuc"),
                        styleTags,
                        occasionTags,
                        colorTags,
                        List.of(),
                        List.of(),
                        List.of(),
                        null,
                        null,
                        request.limit()
                ),
                anchor != null ? anchor.getId() : null
        );

        return new OutfitComboResponse(anchor != null ? anchor.getName() : "Combo AI", response.fallbackUsed(), response.items());
    }

    private RecommendationResponse buildRecommendations(Long authenticatedUserId,
                                                        UserPreferenceProfile profile,
                                                        RecommendationQueryRequest request,
                                                        Long excludeCostumeId) {
        int limit = request.limit() != null && request.limit() > 0
                ? request.limit()
                : aiProperties.getDefaultRecommendationLimit();

        List<FashionTrend> activeTrends = fashionTrendRepository.findActiveTrends(LocalDateTime.now());
        List<ProductEmbedding> readyEmbeddings = productEmbeddingRepository.findReadyEmbeddings(AiEmbeddingStatus.READY, CostumeStatus.ACTIVE);

        List<Long> costumeIds = readyEmbeddings.stream()
                .map(embedding -> embedding.getCostume().getId())
                .toList();
        Map<Long, ProductAiMetadata> metadataByCostumeId = costumeIds.isEmpty()
                ? Map.of()
                : productAiMetadataRepository.findAllByCostumeIds(costumeIds).stream()
                .collect(Collectors.toMap(metadata -> metadata.getCostume().getId(), metadata -> metadata));

        String queryText = buildQueryText(request, profile, activeTrends);
        List<Double> queryEmbedding = aiProviderClient.generateEmbedding(queryText).embedding();

        List<RecommendationCandidate> candidates = readyEmbeddings.stream()
                .filter(embedding -> excludeCostumeId == null || !excludeCostumeId.equals(embedding.getCostume().getId()))
                .map(embedding -> toCandidate(embedding, metadataByCostumeId.get(embedding.getCostume().getId()), queryEmbedding, request, profile, activeTrends))
                .filter(RecommendationCandidate::eligible)
                .sorted(Comparator.comparingDouble(RecommendationCandidate::score).reversed())
                .limit(Math.max(limit, aiProperties.getCandidatePoolSize()))
                .toList();

        if (candidates.isEmpty()) {
            List<CostumeDTO> fallbackCostumes = costumeRepository.findActiveCostumesForRecommendations(CostumeStatus.ACTIVE).stream()
                    .filter(costume -> excludeCostumeId == null || !excludeCostumeId.equals(costume.getId()))
                    .limit(limit)
                    .map(CostumeDTO::fromEntity)
                    .toList();
            List<RecommendationItemResponse> items = fallbackCostumes.stream()
                    .map(costume -> new RecommendationItemResponse(costume, "De xuat theo danh sach san pham dang active.", 0.1d, "RULE_BASED"))
                    .toList();
            return new RecommendationResponse(queryText, profile != null ? profile.getProfileSummaryText() : null, true, items);
        }

        List<RecommendationCandidate> topCandidates = candidates.stream().limit(limit).toList();
        Map<Long, String> llmReasons = requestExplanation(topCandidates, queryText, profile, activeTrends);
        boolean fallbackUsed = llmReasons.isEmpty();

        List<RecommendationItemResponse> items = topCandidates.stream()
                .map(candidate -> new RecommendationItemResponse(
                        CostumeDTO.fromEntity(candidate.costume()),
                        llmReasons.getOrDefault(candidate.costume().getId(), candidate.baseReason()),
                        round(candidate.score()),
                        fallbackUsed ? "RULE_BASED" : "AI_EXPLAINED"
                ))
                .toList();

        return new RecommendationResponse(queryText, profile != null ? profile.getProfileSummaryText() : null, fallbackUsed, items);
    }

    private RecommendationCandidate toCandidate(ProductEmbedding embedding,
                                                ProductAiMetadata metadata,
                                                List<Double> queryEmbedding,
                                                RecommendationQueryRequest request,
                                                UserPreferenceProfile profile,
                                                List<FashionTrend> activeTrends) {
        Costume costume = embedding.getCostume();
        List<Double> productEmbedding = aiDataCodec.readDoubleList(embedding.getEmbeddingPayload());
        double semanticScore = cosineSimilarity(queryEmbedding, productEmbedding);

        List<String> requestedStyles = normalize(request.styleTags());
        List<String> requestedOccasions = normalize(request.occasionTags());
        List<String> requestedColors = normalize(request.colorTags());
        List<String> requestedSizes = normalize(request.sizeTags());
        List<String> requestedGenders = normalize(request.genderTags());
        List<String> profileStyles = profile != null ? aiDataCodec.readStringList(profile.getPreferredStylesJson()) : List.of();
        List<String> profileColors = profile != null ? aiDataCodec.readStringList(profile.getPreferredColorsJson()) : List.of();

        List<String> metadataStyles = metadata != null ? aiDataCodec.readStringList(metadata.getStyleTagsJson()) : List.of();
        List<String> metadataOccasions = metadata != null ? aiDataCodec.readStringList(metadata.getOccasionTagsJson()) : List.of();
        List<String> metadataColors = metadata != null ? aiDataCodec.readStringList(metadata.getColorTagsJson()) : List.of();
        List<String> metadataSizes = metadata != null ? aiDataCodec.readStringList(metadata.getSizeTagsJson()) : List.of();
        List<String> metadataGenders = metadata != null ? aiDataCodec.readStringList(metadata.getGenderTagsJson()) : List.of();
        List<String> metadataTrends = metadata != null ? aiDataCodec.readStringList(metadata.getTrendTagsJson()) : List.of();

        boolean available = costume.getItems().stream().anyMatch(item -> item.getStatus() == ItemStatus.AVAILABLE);
        boolean sizeMatches = requestedSizes.isEmpty() || costume.getItems().stream()
                .filter(item -> item.getStatus() == ItemStatus.AVAILABLE)
                .map(item -> item.getSize().toLowerCase())
                .anyMatch(size -> requestedSizes.stream().map(String::toLowerCase).anyMatch(size::equals))
                || overlaps(metadataSizes, requestedSizes);
        boolean colorMatches = requestedColors.isEmpty() || costume.getItems().stream()
                .filter(item -> item.getStatus() == ItemStatus.AVAILABLE)
                .map(item -> item.getColor().toLowerCase())
                .anyMatch(color -> requestedColors.stream().map(String::toLowerCase).anyMatch(color::equals))
                || overlaps(metadataColors, requestedColors);
        boolean genderMatches = requestedGenders.isEmpty() || metadataGenders.isEmpty() || overlaps(metadataGenders, requestedGenders);
        boolean budgetMatches = isBudgetMatch(costume.getRentalPrice(), request.budgetMin(), request.budgetMax(), profile);

        double requestMatchScore = overlapScore(metadataStyles, requestedStyles)
                + overlapScore(metadataOccasions, requestedOccasions)
                + overlapScore(metadataColors, requestedColors)
                + overlapScore(metadataSizes, requestedSizes)
                + overlapScore(metadataGenders, requestedGenders);
        double profileScore = overlapScore(metadataStyles, profileStyles) + overlapScore(metadataColors, profileColors);
        double trendScore = activeTrends.stream()
                .mapToDouble(trend -> trendBoost(trend, metadataStyles, metadataOccasions, metadataColors, metadataTrends))
                .sum();

        double finalScore = (semanticScore * 0.55d) + (requestMatchScore * 0.2d) + (profileScore * 0.15d) + (trendScore * 0.1d);
        String baseReason = buildBaseReason(costume, requestedStyles, requestedOccasions, requestedColors, metadataStyles, metadataOccasions, metadataColors, activeTrends);

        return new RecommendationCandidate(costume, available && sizeMatches && colorMatches && genderMatches && budgetMatches, finalScore, baseReason, metadataStyles, metadataOccasions, metadataColors);
    }

    private Map<Long, String> requestExplanation(List<RecommendationCandidate> candidates,
                                                 String queryText,
                                                 UserPreferenceProfile profile,
                                                 List<FashionTrend> activeTrends) {
        try {
            List<Map<String, Object>> candidatePayload = candidates.stream()
                    .map(candidate -> {
                        Map<String, Object> payload = new LinkedHashMap<>();
                        payload.put("costumeId", candidate.costume().getId());
                        payload.put("name", candidate.costume().getName());
                        payload.put("category", candidate.costume().getCategory().getName());
                        payload.put("styles", candidate.metadataStyles());
                        payload.put("occasions", candidate.metadataOccasions());
                        payload.put("colors", candidate.metadataColors());
                        payload.put("score", round(candidate.score()));
                        payload.put("baseReason", candidate.baseReason());
                        return payload;
                    })
                    .toList();

            String response = aiProviderClient.generateRecommendationReasons(
                    recommendationPromptBuilder.buildSystemPrompt(),
                    recommendationPromptBuilder.buildUserPrompt(
                            queryText,
                            profile != null ? profile.getProfileSummaryText() : null,
                            summarizeTrends(activeTrends),
                            aiDataCodec.toJson(candidatePayload)
                    )
            );
            if (response == null || response.isBlank()) {
                return Map.of();
            }

            JsonNode root = objectMapper.readTree(response);
            Map<Long, String> reasons = new HashMap<>();
            for (JsonNode itemNode : root.path("items")) {
                if (itemNode.hasNonNull("costumeId") && itemNode.hasNonNull("reason")) {
                    reasons.put(itemNode.get("costumeId").asLong(), itemNode.get("reason").asText());
                }
            }
            return reasons;
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private String buildQueryText(RecommendationQueryRequest request, UserPreferenceProfile profile, List<FashionTrend> activeTrends) {
        List<String> chunks = new ArrayList<>();
        if (request.prompt() != null && !request.prompt().isBlank()) {
            chunks.add("Nhu cau: " + request.prompt().trim());
        }
        appendChunk(chunks, "Phong cach uu tien", request.styleTags());
        appendChunk(chunks, "Dip su dung", request.occasionTags());
        appendChunk(chunks, "Mau sac", request.colorTags());
        appendChunk(chunks, "Size", request.sizeTags());
        appendChunk(chunks, "Gioi tinh", request.genderTags());
        appendChunk(chunks, "Mua", request.seasonTags());
        if (request.budgetMin() != null || request.budgetMax() != null) {
            chunks.add("Ngan sach: " + (request.budgetMin() != null ? request.budgetMin() : "?") + " den " + (request.budgetMax() != null ? request.budgetMax() : "?"));
        }
        if (profile != null && profile.getProfileSummaryText() != null && !profile.getProfileSummaryText().isBlank()) {
            chunks.add("So thich lich su: " + profile.getProfileSummaryText());
        }
        String trendSummary = summarizeTrends(activeTrends);
        if (!trendSummary.isBlank()) {
            chunks.add("Trend hien tai: " + trendSummary);
        }
        if (chunks.isEmpty()) {
            chunks.add("Goi y trang phuc cho thue phu hop, dang con hang va co kha nang duoc ua thich.");
        }
        return String.join("\n", chunks);
    }

    private String summarizeTrends(List<FashionTrend> activeTrends) {
        return activeTrends.stream()
                .limit(3)
                .map(trend -> trend.getTrendName()
                        + " (" + String.join(", ", aiDataCodec.readStringList(trend.getStyleTagsJson())) + ")")
                .collect(Collectors.joining("; "));
    }

    private String buildBaseReason(Costume costume,
                                   List<String> requestedStyles,
                                   List<String> requestedOccasions,
                                   List<String> requestedColors,
                                   List<String> metadataStyles,
                                   List<String> metadataOccasions,
                                   List<String> metadataColors,
                                   List<FashionTrend> activeTrends) {
        Set<String> reasons = new LinkedHashSet<>();
        addOverlapReason(reasons, "phong cach", requestedStyles, metadataStyles);
        addOverlapReason(reasons, "dip su dung", requestedOccasions, metadataOccasions);
        addOverlapReason(reasons, "mau sac", requestedColors, metadataColors);
        for (FashionTrend trend : activeTrends.stream().limit(2).toList()) {
            if (overlaps(metadataStyles, aiDataCodec.readStringList(trend.getStyleTagsJson()))
                    || overlaps(metadataColors, aiDataCodec.readStringList(trend.getColorTagsJson()))
                    || overlaps(metadataOccasions, aiDataCodec.readStringList(trend.getOccasionTagsJson()))) {
                reasons.add("dang an khop voi trend " + trend.getTrendName());
            }
        }
        if (reasons.isEmpty()) {
            reasons.add("dang con hang va co metadata phu hop de dua vao danh sach goi y");
        }
        return "San pham \"" + costume.getName() + "\" " + String.join(", ", reasons) + ".";
    }

    private void addOverlapReason(Set<String> reasons, String label, Collection<String> requested, Collection<String> candidate) {
        List<String> overlap = intersection(requested, candidate);
        if (!overlap.isEmpty()) {
            reasons.add("hop " + label + " " + String.join(", ", overlap));
        }
    }

    private List<String> intersection(Collection<String> left, Collection<String> right) {
        Set<String> normalizedRight = right.stream().map(String::toLowerCase).collect(Collectors.toSet());
        return left.stream()
                .filter(value -> normalizedRight.contains(value.toLowerCase()))
                .toList();
    }

    private boolean isBudgetMatch(BigDecimal rentalPrice,
                                  BigDecimal requestBudgetMin,
                                  BigDecimal requestBudgetMax,
                                  UserPreferenceProfile profile) {
        BigDecimal min = requestBudgetMin != null ? requestBudgetMin : (profile != null ? profile.getPreferredBudgetMin() : null);
        BigDecimal max = requestBudgetMax != null ? requestBudgetMax : (profile != null ? profile.getPreferredBudgetMax() : null);
        if (min != null && rentalPrice.compareTo(min) < 0) {
            return false;
        }
        return max == null || rentalPrice.compareTo(max) <= 0;
    }

    private double trendBoost(FashionTrend trend,
                              List<String> metadataStyles,
                              List<String> metadataOccasions,
                              List<String> metadataColors,
                              List<String> metadataTrends) {
        boolean matched = overlaps(metadataStyles, aiDataCodec.readStringList(trend.getStyleTagsJson()))
                || overlaps(metadataOccasions, aiDataCodec.readStringList(trend.getOccasionTagsJson()))
                || overlaps(metadataColors, aiDataCodec.readStringList(trend.getColorTagsJson()))
                || overlaps(metadataTrends, List.of(trend.getTrendName()));
        if (!matched) {
            return 0d;
        }
        return trend.getBoostScore().doubleValue() / 10d;
    }

    private boolean overlaps(Collection<String> left, Collection<String> right) {
        if (left == null || right == null || left.isEmpty() || right.isEmpty()) {
            return false;
        }
        Set<String> normalized = right.stream().map(String::toLowerCase).collect(Collectors.toSet());
        return left.stream().map(String::toLowerCase).anyMatch(normalized::contains);
    }

    private double overlapScore(Collection<String> left, Collection<String> right) {
        if (left == null || right == null || left.isEmpty() || right.isEmpty()) {
            return 0d;
        }
        long matches = intersection(left, right).size();
        return Math.min(1d, matches / (double) Math.max(1, right.size()));
    }

    private double cosineSimilarity(List<Double> query, List<Double> product) {
        int dimension = Math.min(query.size(), product.size());
        if (dimension == 0) {
            return 0d;
        }
        double dot = 0d;
        double queryNorm = 0d;
        double productNorm = 0d;
        for (int index = 0; index < dimension; index++) {
            double q = query.get(index);
            double p = product.get(index);
            dot += q * p;
            queryNorm += q * q;
            productNorm += p * p;
        }
        if (queryNorm == 0d || productNorm == 0d) {
            return 0d;
        }
        return dot / (Math.sqrt(queryNorm) * Math.sqrt(productNorm));
    }

    private void appendChunk(List<String> chunks, String label, List<String> values) {
        List<String> normalized = normalize(values);
        if (!normalized.isEmpty()) {
            chunks.add(label + ": " + String.join(", ", normalized));
        }
    }

    private List<String> normalize(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }

    private record RecommendationCandidate(
            Costume costume,
            boolean eligible,
            double score,
            String baseReason,
            List<String> metadataStyles,
            List<String> metadataOccasions,
            List<String> metadataColors
    ) {}
}
