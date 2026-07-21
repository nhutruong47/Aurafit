package com.aurafit.entity;

import com.aurafit.enums.ProductEmbeddingSourceType;
import com.aurafit.enums.ProductEmbeddingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_embeddings")
public class ProductEmbedding extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "costume_id", nullable = false, unique = true)
    private Long costumeId;

    @Column(name = "embedding_dimension", nullable = false)
    private Integer embeddingDimension;

    @Column(name = "embedding_model", nullable = false)
    private String embeddingModel;

    @Column(name = "embedding_payload", nullable = false, columnDefinition = "TEXT")
    private String embeddingPayload;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private ProductEmbeddingSourceType sourceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductEmbeddingStatus status;

    @Column(name = "text_hash")
    private String textHash;

    @Column(name = "text_snapshot", columnDefinition = "TEXT")
    private String textSnapshot;
}
