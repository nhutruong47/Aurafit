package com.aurafit.entity;

import com.aurafit.enums.AiEmbeddingSourceType;
import com.aurafit.enums.AiEmbeddingStatus;
import jakarta.persistence.*;
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
@Table(
        name = "product_embeddings",
        uniqueConstraints = @UniqueConstraint(name = "uk_product_embeddings_costume", columnNames = "costume_id")
)
public class ProductEmbedding extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_id", nullable = false)
    private Costume costume;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private AiEmbeddingSourceType sourceType;

    @Column(name = "embedding_model", nullable = false)
    private String embeddingModel;

    @Column(name = "embedding_dimension", nullable = false)
    private Integer embeddingDimension;

    @Lob
    @Column(name = "embedding_payload", nullable = false, columnDefinition = "TEXT")
    private String embeddingPayload;

    @Column(name = "text_hash")
    private String textHash;

    @Lob
    @Column(name = "text_snapshot", columnDefinition = "TEXT")
    private String textSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AiEmbeddingStatus status;

    @Lob
    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;
}
