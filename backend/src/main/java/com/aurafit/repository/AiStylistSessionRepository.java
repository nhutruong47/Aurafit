package com.aurafit.repository;

import com.aurafit.entity.AiStylistSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface AiStylistSessionRepository extends JpaRepository<AiStylistSession, Long> {

    @Query("""
            SELECT DISTINCT s FROM AiStylistSession s
            LEFT JOIN FETCH s.user
            LEFT JOIN FETCH s.contextCostume cc
            LEFT JOIN FETCH cc.category
            LEFT JOIN FETCH cc.metadata
            LEFT JOIN FETCH s.messages
            WHERE s.id = :id
            """)
    Optional<AiStylistSession> findByIdWithMessages(@Param("id") Long id);

    List<AiStylistSession> findByUserIsNullAndGuestSessionIdIgnoreCaseOrderByUpdatedAtDescCreatedAtDescIdDesc(
            String guestSessionId
    );

    Optional<AiStylistSession> findTopByUser_IdOrderByUpdatedAtDescIdDesc(Long userId);

    Optional<AiStylistSession> findByIdAndUser_Id(Long id, Long userId);
}
