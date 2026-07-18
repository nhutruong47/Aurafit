package com.aurafit.repository;

import com.aurafit.entity.ChatSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ChatSession> findBySessionId(String sessionId);
}
