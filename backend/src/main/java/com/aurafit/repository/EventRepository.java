package com.aurafit.repository;

import com.aurafit.entity.Event;
import com.aurafit.enums.EventStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findBySlug(String slug);

    List<Event> findAllByOrderByCreatedAtDesc();

    List<Event> findByStatusOrderByCreatedAtDesc(EventStatus status);

    @Query("""
            SELECT e
            FROM Event e
            WHERE e.status = :status
              AND e.startDate <= :now
              AND e.endDate >= :now
            ORDER BY e.startDate ASC, e.id ASC
            """)
    List<Event> findActiveEvents(
            @Param("status") EventStatus status,
            @Param("now") LocalDateTime now
    );

    @Query("""
            SELECT e
            FROM Event e
            WHERE e.status = :status
              AND e.endDate >= :now
            ORDER BY CASE WHEN e.startDate <= :now THEN 0 ELSE 1 END ASC,
                     e.startDate ASC,
                     e.id ASC
            """)
    List<Event> findUpcomingAndActiveEvents(
            @Param("status") EventStatus status,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );

    @Query("""
            SELECT CASE WHEN COUNT(ec.id) > 0 THEN true ELSE false END
            FROM EventCostume ec
            JOIN ec.event e
            JOIN ec.costume costume
            JOIN costume.category category
            WHERE e.status = :status
              AND e.startDate <= :now
              AND e.endDate >= :now
              AND (
                    category.id = :categoryId
                    OR category.path LIKE CONCAT(:categoryPath, '/%')
              )
            """)
    boolean existsActiveEventForCategory(
            @Param("categoryId") Long categoryId,
            @Param("categoryPath") String categoryPath,
            @Param("status") EventStatus status,
            @Param("now") LocalDateTime now
    );
}
