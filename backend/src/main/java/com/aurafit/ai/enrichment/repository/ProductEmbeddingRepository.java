package com.aurafit.ai.enrichment.repository;

import com.aurafit.ai.enrichment.entity.ProductEmbedding;
import com.aurafit.business.catalog.enums.CostumeStatus;
import com.aurafit.business.catalog.enums.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductEmbeddingRepository extends JpaRepository<ProductEmbedding, Long> {
    Optional<ProductEmbedding> findByCostumeId(Long costumeId);

    @Query("""
            SELECT embedding
            FROM ProductEmbedding embedding
            WHERE embedding.costumeId IN (
                SELECT DISTINCT costume.id
                FROM Costume costume
                JOIN costume.category category
                JOIN costume.items item
                WHERE costume.status = :status
                  AND category.isActive = true
                  AND item.status = :itemStatus
            )
            ORDER BY embedding.costumeId
            """)
    List<ProductEmbedding> findAllByEligibleCostume(
            @Param("status") CostumeStatus status,
            @Param("itemStatus") ItemStatus itemStatus
    );
}
