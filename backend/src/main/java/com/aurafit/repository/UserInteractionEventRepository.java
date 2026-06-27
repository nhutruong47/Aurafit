package com.aurafit.repository;

import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserInteractionEventRepository extends JpaRepository<UserInteractionEvent, Long> {

    List<UserInteractionEvent> findTop60ByUser_IdOrderByCreatedAtDesc(Long userId);

    List<UserInteractionEvent> findTop60BySessionIdOrderByCreatedAtDesc(String sessionId);

    @Modifying
    @Query("""
            UPDATE UserInteractionEvent e
            SET e.user = :user
            WHERE e.sessionId = :sessionId
              AND e.user IS NULL
            """)
    int attachSessionToUser(@Param("sessionId") String sessionId, @Param("user") User user);
}
