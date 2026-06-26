package com.aurafit.repository;

import com.aurafit.entity.CostumeMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CostumeMetadataRepository extends JpaRepository<CostumeMetadata, Long> {
    Optional<CostumeMetadata> findByCostumeId(Long costumeId);
}
