package com.aurafit.repository;

import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CostumeRepository extends JpaRepository<Costume, Long> {

    /**
     * Fetches a paginated list of Costumes with optional filtering by category
     * and search keyword. Uses JOIN FETCH on the category relationship to prevent
     * N+1 queries — a single SQL JOIN is issued instead of one query per costume.
     *
     * <p>The countQuery is required because JOIN FETCH is incompatible with
     * COUNT queries in JPQL. Spring Data uses it to calculate totalElements
     * for the Page object.</p>
     *
     * @param status     Only return costumes with this status (e.g. ACTIVE)
     * @param categoryId Optional category filter. Pass null to skip.
     * @param keyword    Optional search term matched against costume name (case-insensitive). Pass null to skip.
     * @param pageable   Pagination and sorting parameters.
     * @return A Page of Costume entities with their Category eagerly loaded.
     */
    @Query(value = """
            SELECT c FROM Costume c
            JOIN FETCH c.category
            WHERE c.status = :status
              AND (:categoryId IS NULL OR c.category.id = :categoryId)
              AND LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """,
            countQuery = """
            SELECT COUNT(c) FROM Costume c
            WHERE c.status = :status
              AND (:categoryId IS NULL OR c.category.id = :categoryId)
              AND LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<Costume> findAllWithFilters(
            @Param("status") CostumeStatus status,
            @Param("categoryId") Long categoryId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * Fetches a single Costume by ID with its Category eagerly loaded.
     * Avoids an extra query when mapping to CostumeDTO.
     */
    @Query("SELECT c FROM Costume c JOIN FETCH c.category WHERE c.id = :id")
    Optional<Costume> findByIdWithCategory(@Param("id") Long id);
}
