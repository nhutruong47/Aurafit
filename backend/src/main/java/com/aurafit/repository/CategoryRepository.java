package com.aurafit.repository;

import com.aurafit.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByIdAndIsActiveTrue(Long id);

    Optional<Category> findByPath(String path);

    Optional<Category> findByPathAndIsActiveTrue(String path);

    boolean existsByPath(String path);

    List<Category> findByParentIsNullOrderBySortOrderAsc();

    List<Category> findByParentIdOrderBySortOrderAsc(Long parentId);

    List<Category> findByIsActiveTrueOrderBySortOrderAsc();

    List<Category> findByParentIsNullAndIsActiveTrueOrderBySortOrderAsc();

    List<Category> findByParentIdAndIsActiveTrueOrderBySortOrderAsc(Long parentId);

    @Query("""
            SELECT c
            FROM Category c
            WHERE c.isActive = true
              AND (
                    LOWER(c.name) IN :identifiers
                    OR LOWER(c.slug) IN :identifiers
                    OR LOWER(c.path) IN :identifiers
              )
            ORDER BY c.id ASC
            """)
    List<Category> findActiveByDemandIdentifiers(@Param("identifiers") List<String> identifiers);

    @Query("SELECT c FROM Category c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))")
    Page<Category> searchCategories(@Param("keyword") String keyword, Pageable pageable);
}
