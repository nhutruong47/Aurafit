package com.aurafit.business.catalog.repository;

import com.aurafit.business.catalog.entity.CostumeMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CostumeMetadataRepository extends JpaRepository<CostumeMetadata, Long> {
    Optional<CostumeMetadata> findByCostumeId(Long costumeId);
}
