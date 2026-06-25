package com.aurafit.repository;

import com.aurafit.entity.UserBehaviorEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserBehaviorEventRepository extends JpaRepository<UserBehaviorEvent, Long> {

    @Query("""
            SELECT ube FROM UserBehaviorEvent ube
            LEFT JOIN FETCH ube.costume c
            LEFT JOIN FETCH c.category
            WHERE ube.user.id = :userId
            ORDER BY ube.occurredAt DESC
            """)
    List<UserBehaviorEvent> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT ube FROM UserBehaviorEvent ube
            LEFT JOIN FETCH ube.costume c
            LEFT JOIN FETCH c.category
            WHERE ube.sessionId = :sessionId
            ORDER BY ube.occurredAt DESC
            """)
    List<UserBehaviorEvent> findRecentBySessionId(@Param("sessionId") String sessionId, Pageable pageable);
}
