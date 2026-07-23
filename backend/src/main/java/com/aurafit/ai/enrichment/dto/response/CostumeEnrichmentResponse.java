package com.aurafit.ai.enrichment.dto.response;

import com.aurafit.ai.enrichment.entity.ProductAiMetadata;
import com.aurafit.ai.enrichment.entity.ProductEmbedding;

public record CostumeEnrichmentResponse(
        Long costumeId,
        ProductAiMetadataResponse metadata,
        ProductEmbeddingResponse embedding
) {
    public static CostumeEnrichmentResponse fromEntities(
            Long costumeId,
            ProductAiMetadata metadata,
            ProductEmbedding embedding
    ) {
        return new CostumeEnrichmentResponse(
                costumeId,
                ProductAiMetadataResponse.fromEntity(metadata),
                ProductEmbeddingResponse.fromEntity(embedding)
        );
    }
}
