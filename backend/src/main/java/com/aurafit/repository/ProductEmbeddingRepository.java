package com.aurafit.repository;

import com.aurafit.entity.ProductEmbedding;
import com.aurafit.enums.AiEmbeddingStatus;
import com.aurafit.enums.CostumeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductEmbeddingRepository extends JpaRepository<ProductEmbedding, Long> {

    @Query("""
            SELECT DISTINCT pe FROM ProductEmbedding pe
            JOIN FETCH pe.costume c
            JOIN FETCH c.category
            LEFT JOIN FETCH c.items
            WHERE c.id = :costumeId
            """)
    Optional<ProductEmbedding> findByCostumeId(@Param("costumeId") Long costumeId);

    @Query("""
            SELECT DISTINCT pe FROM ProductEmbedding pe
            JOIN FETCH pe.costume c
            JOIN FETCH c.category
            LEFT JOIN FETCH c.items
            WHERE pe.status = :status
              AND c.status = :costumeStatus
            """)
    List<ProductEmbedding> findReadyEmbeddings(
            @Param("status") AiEmbeddingStatus status,
            @Param("costumeStatus") CostumeStatus costumeStatus
    );
}
