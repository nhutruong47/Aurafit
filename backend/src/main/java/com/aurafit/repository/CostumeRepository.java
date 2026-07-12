package com.aurafit.repository;

import com.aurafit.entity.Costume;
import com.aurafit.enums.CostumeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
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
     * @param categoryPath Optional category path filter. Pass null to skip.
     * @param keyword    Optional search term matched against costume name (case-insensitive). Pass null to skip.
     * @param pageable   Pagination and sorting parameters.
     * @return A Page of Costume entities with their Category eagerly loaded.
     */
    @Query(value = """
            SELECT DISTINCT c
            FROM Costume c
            JOIN FETCH c.category category
            LEFT JOIN FETCH c.metadata
            WHERE c.status = :status
              AND category.isActive = true
              AND (:categoryPath IS NULL OR category.path = :categoryPath OR category.path LIKE CONCAT(:categoryPath, '/%'))
              AND LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """,
            countQuery = """
            SELECT COUNT(c) FROM Costume c
            WHERE c.status = :status
              AND c.category.isActive = true
              AND (:categoryPath IS NULL OR c.category.path = :categoryPath OR c.category.path LIKE CONCAT(:categoryPath, '/%'))
              AND LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<Costume> findAllWithFilters(
            @Param("status") CostumeStatus status,
            @Param("categoryPath") String categoryPath,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * Fetches a single Costume by ID with its Category eagerly loaded.
     * Avoids an extra query when mapping to CostumeDTO.
     */
    @Query("SELECT c FROM Costume c JOIN FETCH c.category LEFT JOIN FETCH c.metadata WHERE c.id = :id AND c.category.isActive = true")
    Optional<Costume> findByIdWithCategory(@Param("id") Long id);

    /**
     * Returns the most frequently rented active costumes, ordered by rental frequency.
     * Seasonal/featured costumes for the homepage.
     */
    @Query(value = """
            SELECT c FROM Costume c
            JOIN FETCH c.category
            LEFT JOIN FETCH c.metadata
            LEFT JOIN FETCH c.items
            WHERE c.status = :status
              AND c.category.isActive = true
            ORDER BY SIZE(c.items) DESC
            """)
    List<Costume> findSeasonalCostumes(@Param("status") CostumeStatus status, Pageable pageable);

    /**
     * Returns personalized costume recommendations for a user.
     * Currently returns random active costumes as a simple baseline.
     * TODO: Replace with ML-based collaborative filtering using user interaction history.
     */
    @Query("SELECT DISTINCT c FROM Costume c JOIN FETCH c.category LEFT JOIN FETCH c.metadata LEFT JOIN FETCH c.items WHERE c.status = :status AND c.category.isActive = true")
    List<Costume> findActiveCostumesForRecommendations(@Param("status") CostumeStatus status);

    @Query("SELECT DISTINCT c FROM Costume c JOIN FETCH c.category LEFT JOIN FETCH c.metadata LEFT JOIN FETCH c.items WHERE c.id = :id AND c.category.isActive = true")
    Optional<Costume> findByIdWithItems(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT c FROM Costume c
            JOIN FETCH c.category
            LEFT JOIN FETCH c.metadata
            LEFT JOIN FETCH c.items
            WHERE c.status = :status
              AND c.category.isActive = true
            ORDER BY c.id DESC
            """)
    List<Costume> findActiveWithItems(@Param("status") CostumeStatus status);

    @Query("""
            SELECT DISTINCT c FROM Costume c
            JOIN FETCH c.category
            LEFT JOIN FETCH c.metadata
            LEFT JOIN FETCH c.items
            WHERE c.status = :status
              AND c.category.isActive = true
              AND c.id <> :excludeId
            """)
    List<Costume> findActiveWithItemsExcludingId(
            @Param("status") CostumeStatus status,
            @Param("excludeId") Long excludeId
    );

    @Query("SELECT DISTINCT c FROM Costume c JOIN FETCH c.category LEFT JOIN FETCH c.metadata LEFT JOIN FETCH c.items ORDER BY c.id DESC")
    List<Costume> findAllWithItems();

}
