package com.aurafit.business.catalog.repository;

import com.aurafit.business.catalog.entity.EventCostume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EventCostumeRepository extends JpaRepository<EventCostume, Long> {

    @Query("""
            SELECT ec
            FROM EventCostume ec
            JOIN FETCH ec.event e
            JOIN FETCH ec.costume c
            WHERE c.id IN :costumeIds
              AND e.status = com.aurafit.business.catalog.enums.EventStatus.ACTIVE
              AND e.startDate <= :now
              AND e.endDate >= :now
            """)
    List<EventCostume> findActiveEventsForCostumeIds(
            @Param("costumeIds") List<Long> costumeIds,
            @Param("now") LocalDateTime now
    );

    @Query("""
            SELECT DISTINCT ec
            FROM EventCostume ec
            JOIN FETCH ec.costume c
            LEFT JOIN FETCH c.images
            WHERE ec.event.id IN :eventIds
            ORDER BY ec.event.id ASC, ec.id ASC
            """)
    List<EventCostume> findAllByEventIdsWithCostumes(@Param("eventIds") List<Long> eventIds);

    @Query("""
            SELECT DISTINCT ec
            FROM EventCostume ec
            JOIN FETCH ec.costume c
            LEFT JOIN FETCH c.images
            WHERE ec.event.id = :eventId
            ORDER BY ec.id ASC
            """)
    List<EventCostume> findAllByEventIdWithCostumes(@Param("eventId") Long eventId);

    long deleteByEventIdAndCostumeId(Long eventId, Long costumeId);
}
