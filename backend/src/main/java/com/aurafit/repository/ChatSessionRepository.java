package com.aurafit.repository;

import com.aurafit.entity.ChatSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ChatSession> findBySessionId(String sessionId);

    @Query("""
            SELECT chatSession
            FROM ChatSession chatSession
            JOIN ChatMessage message ON message.chatSession = chatSession
            WHERE chatSession.user.id = :userId
            GROUP BY chatSession
            ORDER BY MAX(message.createdAt) DESC
            """)
    List<ChatSession> findByUserIdOrderByLastMessageDesc(@Param("userId") Long userId);

    Optional<ChatSession> findBySessionIdAndUserId(String sessionId, Long userId);

    Optional<ChatSession> findBySessionIdAndUserIsNull(String sessionId);
}
