package com.aurafit.service.impl;

import com.aurafit.dto.request.FashionTrendUpsertRequest;
import com.aurafit.dto.request.UpsertProductAiMetadataRequest;
import com.aurafit.dto.response.FashionTrendResponse;
import com.aurafit.dto.response.ProductAiMetadataResponse;
import com.aurafit.entity.Costume;
import com.aurafit.entity.FashionTrend;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.ProductEmbedding;
import com.aurafit.enums.AiEmbeddingSourceType;
import com.aurafit.enums.AiEmbeddingStatus;
import com.aurafit.enums.FashionTrendSourceType;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.FashionTrendRepository;
import com.aurafit.repository.ProductAiMetadataRepository;
import com.aurafit.repository.ProductEmbeddingRepository;
import com.aurafit.service.AiAdminService;
import com.aurafit.service.AiDataCodec;
import com.aurafit.service.AiProviderClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Service
@Transactional
public class AiAdminServiceImpl implements AiAdminService {

    private final CostumeRepository costumeRepository;
    private final ProductAiMetadataRepository productAiMetadataRepository;
    private final ProductEmbeddingRepository productEmbeddingRepository;
    private final FashionTrendRepository fashionTrendRepository;
    private final AiDataCodec aiDataCodec;
    private final AiProviderClient aiProviderClient;

    public AiAdminServiceImpl(CostumeRepository costumeRepository,
                              ProductAiMetadataRepository productAiMetadataRepository,
                              ProductEmbeddingRepository productEmbeddingRepository,
                              FashionTrendRepository fashionTrendRepository,
                              AiDataCodec aiDataCodec,
                              AiProviderClient aiProviderClient) {
        this.costumeRepository = costumeRepository;
        this.productAiMetadataRepository = productAiMetadataRepository;
        this.productEmbeddingRepository = productEmbeddingRepository;
        this.fashionTrendRepository = fashionTrendRepository;
        this.aiDataCodec = aiDataCodec;
        this.aiProviderClient = aiProviderClient;
    }

    @Override
    @Transactional(readOnly = true)
    public ProductAiMetadataResponse getProductMetadata(Long costumeId) {
        Costume costume = costumeRepository.findByIdWithCategory(costumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", costumeId));
        ProductAiMetadata metadata = productAiMetadataRepository.findByCostumeId(costumeId).orElse(null);
        ProductEmbedding embedding = productEmbeddingRepository.findByCostumeId(costumeId).orElse(null);
        return toProductMetadataResponse(costume, metadata, embedding);
    }

    @Override
    public ProductAiMetadataResponse upsertProductMetadata(Long costumeId, UpsertProductAiMetadataRequest request, String actorEmail) {
        Costume costume = costumeRepository.findByIdWithCategory(costumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", costumeId));

        ProductAiMetadata metadata = productAiMetadataRepository.findByCostumeId(costumeId)
                .orElse(ProductAiMetadata.builder().costume(costume).createdByEmail(actorEmail).build());

        metadata.setStyleTagsJson(aiDataCodec.toJson(normalize(request.styleTags())));
        metadata.setOccasionTagsJson(aiDataCodec.toJson(normalize(request.occasionTags())));
        metadata.setTrendTagsJson(aiDataCodec.toJson(normalize(request.trendTags())));
        metadata.setSizeTagsJson(aiDataCodec.toJson(normalize(request.sizeTags())));
        metadata.setColorTagsJson(aiDataCodec.toJson(normalize(request.colorTags())));
        metadata.setSeasonTagsJson(aiDataCodec.toJson(normalize(request.seasonTags())));
        metadata.setGenderTagsJson(aiDataCodec.toJson(normalize(request.genderTags())));
        metadata.setMaterialTagsJson(aiDataCodec.toJson(normalize(request.materialTags())));
        metadata.setFitTagsJson(aiDataCodec.toJson(normalize(request.fitTags())));
        metadata.setBudgetTier(blankToNull(request.budgetTier()));
        metadata.setSilhouette(blankToNull(request.silhouette()));
        metadata.setFormalityLevel(blankToNull(request.formalityLevel()));
        metadata.setAdminNotes(blankToNull(request.adminNotes()));
        metadata.setUpdatedByEmail(actorEmail);
        metadata.setSearchableText(buildSearchableText(costume, metadata));
        ProductAiMetadata savedMetadata = productAiMetadataRepository.save(metadata);

        AiProviderClient.EmbeddingResult embeddingResult = aiProviderClient.generateEmbedding(savedMetadata.getSearchableText());
        ProductEmbedding embedding = productEmbeddingRepository.findByCostumeId(costumeId)
                .orElse(ProductEmbedding.builder().costume(costume).sourceType(AiEmbeddingSourceType.PRODUCT_METADATA).build());
        embedding.setEmbeddingModel(embeddingResult.model());
        embedding.setEmbeddingDimension(embeddingResult.embedding().size());
        embedding.setEmbeddingPayload(aiDataCodec.toJson(embeddingResult.embedding()));
        embedding.setTextSnapshot(savedMetadata.getSearchableText());
        embedding.setTextHash(Integer.toHexString(savedMetadata.getSearchableText().hashCode()));
        embedding.setStatus(AiEmbeddingStatus.READY);
        embedding.setLastError(null);
        ProductEmbedding savedEmbedding = productEmbeddingRepository.save(embedding);

        return toProductMetadataResponse(costume, savedMetadata, savedEmbedding);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FashionTrendResponse> getFashionTrends() {
        return fashionTrendRepository.findAll().stream()
                .map(this::toFashionTrendResponse)
                .toList();
    }

    @Override
    public FashionTrendResponse createFashionTrend(FashionTrendUpsertRequest request, String actorEmail) {
        FashionTrend trend = new FashionTrend();
        applyTrendRequest(trend, request, actorEmail, true);
        return toFashionTrendResponse(fashionTrendRepository.save(trend));
    }

    @Override
    public FashionTrendResponse updateFashionTrend(Long trendId, FashionTrendUpsertRequest request, String actorEmail) {
        FashionTrend trend = fashionTrendRepository.findById(trendId)
                .orElseThrow(() -> new ResourceNotFoundException("FashionTrend", "id", trendId));
        applyTrendRequest(trend, request, actorEmail, false);
        return toFashionTrendResponse(fashionTrendRepository.save(trend));
    }

    private void applyTrendRequest(FashionTrend trend, FashionTrendUpsertRequest request, String actorEmail, boolean creating) {
        trend.setTrendName(request.trendName().trim());
        trend.setSeasonLabel(blankToNull(request.seasonLabel()));
        trend.setStyleTagsJson(aiDataCodec.toJson(normalize(request.styleTags())));
        trend.setColorTagsJson(aiDataCodec.toJson(normalize(request.colorTags())));
        trend.setOccasionTagsJson(aiDataCodec.toJson(normalize(request.occasionTags())));
        trend.setAudienceTagsJson(aiDataCodec.toJson(normalize(request.audienceTags())));
        trend.setBoostScore(Optional.ofNullable(request.boostScore()).orElse(BigDecimal.ONE));
        trend.setSourceType(Optional.ofNullable(request.sourceType()).orElse(FashionTrendSourceType.ADMIN_MANUAL));
        trend.setSourceNote(blankToNull(request.sourceNote()));
        trend.setSummaryText(blankToNull(request.summaryText()));
        trend.setActiveFrom(request.activeFrom());
        trend.setActiveTo(request.activeTo());
        if (creating) {
            trend.setCreatedByEmail(actorEmail);
        }
        trend.setUpdatedByEmail(actorEmail);
    }

    private ProductAiMetadataResponse toProductMetadataResponse(Costume costume, ProductAiMetadata metadata, ProductEmbedding embedding) {
        return new ProductAiMetadataResponse(
                costume.getId(),
                costume.getName(),
                metadata != null ? aiDataCodec.readStringList(metadata.getStyleTagsJson()) : List.of(),
                metadata != null ? aiDataCodec.readStringList(metadata.getOccasionTagsJson()) : List.of(),
                metadata != null ? aiDataCodec.readStringList(metadata.getTrendTagsJson()) : List.of(),
                metadata != null ? aiDataCodec.readStringList(metadata.getSizeTagsJson()) : List.of(),
                metadata != null ? aiDataCodec.readStringList(metadata.getColorTagsJson()) : List.of(),
                metadata != null ? aiDataCodec.readStringList(metadata.getSeasonTagsJson()) : List.of(),
                metadata != null ? aiDataCodec.readStringList(metadata.getGenderTagsJson()) : List.of(),
                metadata != null ? aiDataCodec.readStringList(metadata.getMaterialTagsJson()) : List.of(),
                metadata != null ? aiDataCodec.readStringList(metadata.getFitTagsJson()) : List.of(),
                metadata != null ? metadata.getBudgetTier() : null,
                metadata != null ? metadata.getSilhouette() : null,
                metadata != null ? metadata.getFormalityLevel() : null,
                metadata != null ? metadata.getAdminNotes() : null,
                metadata != null ? metadata.getSearchableText() : null,
                embedding != null ? embedding.getStatus() : null,
                embedding != null ? embedding.getEmbeddingModel() : null
        );
    }

    private FashionTrendResponse toFashionTrendResponse(FashionTrend trend) {
        return new FashionTrendResponse(
                trend.getId(),
                trend.getTrendName(),
                trend.getSeasonLabel(),
                aiDataCodec.readStringList(trend.getStyleTagsJson()),
                aiDataCodec.readStringList(trend.getColorTagsJson()),
                aiDataCodec.readStringList(trend.getOccasionTagsJson()),
                aiDataCodec.readStringList(trend.getAudienceTagsJson()),
                trend.getBoostScore(),
                trend.getSourceType(),
                trend.getSourceNote(),
                trend.getSummaryText(),
                trend.getActiveFrom(),
                trend.getActiveTo()
        );
    }

    private String buildSearchableText(Costume costume, ProductAiMetadata metadata) {
        List<String> parts = new ArrayList<>();
        parts.add("Ten san pham: " + costume.getName());
        parts.add("Danh muc: " + costume.getCategory().getName());
        parts.add("Mo ta: " + blankToEmpty(costume.getDescription()));
        parts.add("Gia thue: " + costume.getRentalPrice());
        parts.add("Tien coc: " + costume.getDepositPrice());
        appendList(parts, "Phong cach", aiDataCodec.readStringList(metadata.getStyleTagsJson()));
        appendList(parts, "Dip su dung", aiDataCodec.readStringList(metadata.getOccasionTagsJson()));
        appendList(parts, "Trend", aiDataCodec.readStringList(metadata.getTrendTagsJson()));
        appendList(parts, "Size", aiDataCodec.readStringList(metadata.getSizeTagsJson()));
        appendList(parts, "Mau sac", aiDataCodec.readStringList(metadata.getColorTagsJson()));
        appendList(parts, "Mua", aiDataCodec.readStringList(metadata.getSeasonTagsJson()));
        appendList(parts, "Gioi tinh", aiDataCodec.readStringList(metadata.getGenderTagsJson()));
        appendList(parts, "Chat lieu", aiDataCodec.readStringList(metadata.getMaterialTagsJson()));
        appendList(parts, "Form", aiDataCodec.readStringList(metadata.getFitTagsJson()));
        parts.add("Muc ngan sach: " + blankToEmpty(metadata.getBudgetTier()));
        parts.add("Silhouette: " + blankToEmpty(metadata.getSilhouette()));
        parts.add("Formality: " + blankToEmpty(metadata.getFormalityLevel()));
        parts.add("Ghi chu admin: " + blankToEmpty(metadata.getAdminNotes()));
        return parts.stream()
                .filter(value -> value != null && !value.endsWith(": "))
                .reduce((left, right) -> left + "\n" + right)
                .orElse(costume.getName());
    }

    private void appendList(List<String> parts, String label, List<String> values) {
        if (!values.isEmpty()) {
            parts.add(label + ": " + String.join(", ", values));
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

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
