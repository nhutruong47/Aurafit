package com.aurafit.repository;

import com.aurafit.entity.ChatMessage;
import com.aurafit.entity.ChatSession;
import com.aurafit.enums.ChatMessageRole;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatSessionOrderByCreatedAtAsc(ChatSession chatSession);

    List<ChatMessage> findByChatSessionOrderByCreatedAtDesc(ChatSession chatSession, Pageable pageable);

    Optional<ChatMessage> findFirstByChatSessionAndRoleOrderByCreatedAtDesc(
            ChatSession chatSession,
            ChatMessageRole role
    );

    Optional<ChatMessage> findFirstByChatSessionAndRoleOrderByCreatedAtAsc(
            ChatSession chatSession,
            ChatMessageRole role
    );

    long countByChatSessionAndRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            ChatSession chatSession,
            ChatMessageRole role,
            LocalDateTime periodStart,
            LocalDateTime periodEnd
    );

    @Query("""
            SELECT m.intentJson
            FROM ChatMessage m
            WHERE m.role = :role
              AND m.createdAt >= :periodStart
              AND m.createdAt < :periodEnd
              AND m.intentJson IS NOT NULL
            """)
    List<String> findIntentJsonByRoleAndPeriod(
            @Param("role") ChatMessageRole role,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );

    long countByRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            ChatMessageRole role,
            LocalDateTime periodStart,
            LocalDateTime periodEnd
    );

    @Query("""
            SELECT COUNT(DISTINCT m.chatSession.id)
            FROM ChatMessage m
            WHERE m.role = :role
              AND m.createdAt >= :periodStart
              AND m.createdAt < :periodEnd
            """)
    long countDistinctSessionsByRoleAndPeriod(
            @Param("role") ChatMessageRole role,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );

    @Query("""
            SELECT COUNT(DISTINCT m.chatSession.id)
            FROM ChatMessage m
            WHERE m.role = :role
              AND m.createdAt >= :periodStart
              AND m.createdAt < :periodEnd
              AND m.recommendedCostumeIds IS NOT NULL
              AND LENGTH(TRIM(m.recommendedCostumeIds)) > 0
              AND EXISTS (
                  SELECT userMessage.id
                  FROM ChatMessage userMessage
                  WHERE userMessage.chatSession = m.chatSession
                    AND userMessage.role = :userRole
                    AND userMessage.createdAt >= :periodStart
                    AND userMessage.createdAt < :periodEnd
              )
            """)
    long countDistinctRecommendedSessionsByRoleAndPeriod(
            @Param("role") ChatMessageRole role,
            @Param("userRole") ChatMessageRole userRole,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );
}
