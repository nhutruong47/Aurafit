package com.aurafit.repository;

import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.InteractionEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface UserInteractionEventRepository extends JpaRepository<UserInteractionEvent, Long> {

    @Modifying
    @Query("""
            UPDATE UserInteractionEvent e
            SET e.user = :user
            WHERE e.sessionId = :sessionId
              AND e.user IS NULL
            """)
    int attachSessionToUser(@Param("sessionId") String sessionId, @Param("user") User user);

    @Query("""
            SELECT e.eventType, COUNT(e)
            FROM UserInteractionEvent e
            WHERE e.createdAt >= :periodStart
              AND e.createdAt < :periodEnd
            GROUP BY e.eventType
            """)
    List<Object[]> countByEventTypeForPeriod(
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );

    @Query("""
            SELECT e.eventType, e.metadataJson
            FROM UserInteractionEvent e
            WHERE e.eventType IN :eventTypes
              AND e.createdAt >= :periodStart
              AND e.createdAt < :periodEnd
            """)
    List<Object[]> findEventTypeAndMetadataForPeriod(
            @Param("eventTypes") List<InteractionEventType> eventTypes,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );
}
