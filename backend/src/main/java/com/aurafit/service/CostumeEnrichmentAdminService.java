package com.aurafit.service;

import com.aurafit.dto.response.CostumeEnrichmentResponse;
import com.aurafit.entity.Costume;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.ProductEmbedding;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.ProductAiMetadataRepository;
import com.aurafit.repository.ProductEmbeddingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@Slf4j
public class CostumeEnrichmentAdminService {

    private final CostumeRepository costumeRepository;
    private final ProductAiMetadataRepository productAiMetadataRepository;
    private final ProductEmbeddingRepository productEmbeddingRepository;
    private final EnrichmentService enrichmentService;
    private final String embeddingModel;

    public CostumeEnrichmentAdminService(
            CostumeRepository costumeRepository,
            ProductAiMetadataRepository productAiMetadataRepository,
            ProductEmbeddingRepository productEmbeddingRepository,
            EnrichmentService enrichmentService,
            @Value("${ai.embedding-model:}") String embeddingModel
    ) {
        this.costumeRepository = costumeRepository;
        this.productAiMetadataRepository = productAiMetadataRepository;
        this.productEmbeddingRepository = productEmbeddingRepository;
        this.enrichmentService = enrichmentService;
        this.embeddingModel = embeddingModel == null ? "" : embeddingModel.trim();
    }

    public CostumeEnrichmentResponse enrichOne(Long costumeId) {
        if (!StringUtils.hasText(embeddingModel)) {
            throw new BadRequestException(
                    "AI_EMBEDDING_MODEL is not configured; costume enrichment was not started."
            );
        }

        Costume costume = findCostumeWithMetadata(costumeId);
        long startedAt = System.nanoTime();
        log.info("Single costume enrichment started costumeId={}", costumeId);

        try {
            ProductAiMetadata metadata = enrichmentService.enrichMetadata(costume, costume.getMetadata());
            ProductEmbedding embedding = enrichmentService.embedProduct(costume, metadata);
            log.info(
                    "Single costume enrichment finished costumeId={} embeddingStatus={} durationMs={}",
                    costumeId,
                    embedding.getStatus(),
                    elapsedMillis(startedAt)
            );
            return CostumeEnrichmentResponse.fromEntities(costumeId, metadata, embedding);
        } catch (RuntimeException exception) {
            log.error(
                    "Single costume enrichment failed costumeId={} errorType={} message={} durationMs={}",
                    costumeId,
                    exception.getClass().getSimpleName(),
                    exception.getMessage(),
                    elapsedMillis(startedAt),
                    exception
            );
            throw exception;
        }
    }

    public CostumeEnrichmentResponse getEnrichment(Long costumeId) {
        if (!costumeRepository.existsById(costumeId)) {
            throw new ResourceNotFoundException("Costume", "id", costumeId);
        }
        ProductAiMetadata metadata = productAiMetadataRepository.findByCostumeId(costumeId).orElse(null);
        ProductEmbedding embedding = productEmbeddingRepository.findByCostumeId(costumeId).orElse(null);
        return CostumeEnrichmentResponse.fromEntities(costumeId, metadata, embedding);
    }

    private Costume findCostumeWithMetadata(Long costumeId) {
        return costumeRepository.findAllByIdWithMetadata(List.of(costumeId)).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", costumeId));
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
