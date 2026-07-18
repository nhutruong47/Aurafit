package com.aurafit.repository;

import com.aurafit.entity.Review;
import com.aurafit.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = {"costume", "user"})
    Page<Review> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"costume", "user"})
    Page<Review> findByStatus(ReviewStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"costume", "user"})
    Page<Review> findByCostume_Id(Long costumeId, Pageable pageable);

    @EntityGraph(attributePaths = {"costume", "user"})
    Page<Review> findByCostume_IdAndStatus(Long costumeId, ReviewStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"costume", "user"})
    @Query("""
            SELECT r
            FROM Review r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:rating IS NULL OR r.rating = :rating)
              AND (CAST(:costumeName AS String) IS NULL
                   OR LOWER(r.costume.name) LIKE LOWER(CONCAT('%', CAST(:costumeName AS String), '%')))
            """)
    Page<Review> findAdminReviews(
            @Param("status") ReviewStatus status,
            @Param("rating") Integer rating,
            @Param("costumeName") String costumeName,
            Pageable pageable
    );

    Page<Review> findByCostume_IdAndStatusAndRating(
            Long costumeId,
            ReviewStatus status,
            int rating,
            Pageable pageable
    );

    boolean existsByRentalOrderDetail_Id(Long rentalOrderDetailId);

    @Query("""
            SELECT
                COALESCE(AVG(r.rating), 0.0) AS averageRating,
                COUNT(r) AS totalCount,
                COALESCE(SUM(CASE WHEN r.rating = 1 THEN 1L ELSE 0L END), 0L) AS oneStarCount,
                COALESCE(SUM(CASE WHEN r.rating = 2 THEN 1L ELSE 0L END), 0L) AS twoStarCount,
                COALESCE(SUM(CASE WHEN r.rating = 3 THEN 1L ELSE 0L END), 0L) AS threeStarCount,
                COALESCE(SUM(CASE WHEN r.rating = 4 THEN 1L ELSE 0L END), 0L) AS fourStarCount,
                COALESCE(SUM(CASE WHEN r.rating = 5 THEN 1L ELSE 0L END), 0L) AS fiveStarCount
            FROM Review r
            WHERE r.costume.id = :costumeId
              AND r.status = :status
            """)
    ReviewRatingSummaryProjection getRatingSummaryByCostumeIdAndStatus(
            @Param("costumeId") Long costumeId,
            @Param("status") ReviewStatus status
    );
}
