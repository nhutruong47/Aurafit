package com.aurafit.ai.enrichment.dto.response;

import com.aurafit.ai.enrichment.entity.ProductEmbedding;
import com.aurafit.ai.enrichment.enums.ProductEmbeddingSourceType;
import com.aurafit.ai.enrichment.enums.ProductEmbeddingStatus;

import java.time.LocalDateTime;

public record ProductEmbeddingResponse(
        Long id,
        Long costumeId,
        Integer embeddingDimension,
        String embeddingModel,
        ProductEmbeddingSourceType sourceType,
        ProductEmbeddingStatus status,
        String textHash,
        String lastError,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ProductEmbeddingResponse fromEntity(ProductEmbedding embedding) {
        if (embedding == null) {
            return null;
        }
        return new ProductEmbeddingResponse(
                embedding.getId(),
                embedding.getCostumeId(),
                embedding.getEmbeddingDimension(),
                embedding.getEmbeddingModel(),
                embedding.getSourceType(),
                embedding.getStatus(),
                embedding.getTextHash(),
                embedding.getLastError(),
                embedding.getCreatedAt(),
                embedding.getUpdatedAt()
        );
    }
}
