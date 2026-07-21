package com.aurafit.repository;

import com.aurafit.entity.ProductEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductEmbeddingRepository extends JpaRepository<ProductEmbedding, Long> {
    Optional<ProductEmbedding> findByCostumeId(Long costumeId);
}
