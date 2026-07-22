package com.aurafit.repository;

import com.aurafit.entity.Event;
import com.aurafit.enums.EventStatus;
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
}
