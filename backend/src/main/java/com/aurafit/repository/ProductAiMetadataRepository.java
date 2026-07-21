package com.aurafit.repository;

import com.aurafit.entity.ProductAiMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductAiMetadataRepository extends JpaRepository<ProductAiMetadata, Long> {
    Optional<ProductAiMetadata> findByCostumeId(Long costumeId);

    List<ProductAiMetadata> findAllByCostumeIdIn(List<Long> costumeIds);
}
