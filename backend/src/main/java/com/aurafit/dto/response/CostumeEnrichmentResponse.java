package com.aurafit.dto.response;

import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.ProductEmbedding;

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
