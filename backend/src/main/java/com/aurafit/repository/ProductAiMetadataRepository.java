package com.aurafit.repository;

import com.aurafit.entity.ProductAiMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductAiMetadataRepository extends JpaRepository<ProductAiMetadata, Long> {

    @Query("SELECT pam FROM ProductAiMetadata pam JOIN FETCH pam.costume c JOIN FETCH c.category WHERE c.id = :costumeId")
    Optional<ProductAiMetadata> findByCostumeId(@Param("costumeId") Long costumeId);

    @Query("SELECT pam FROM ProductAiMetadata pam JOIN FETCH pam.costume c JOIN FETCH c.category WHERE c.id IN :costumeIds")
    List<ProductAiMetadata> findAllByCostumeIds(@Param("costumeIds") Collection<Long> costumeIds);
}
