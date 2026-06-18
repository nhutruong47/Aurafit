package com.aurafit.repository;

import com.aurafit.entity.InteractionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InteractionLogRepository extends JpaRepository<InteractionLog, Long> {

    List<InteractionLog> findByUserIdAndTargetTypeOrderByCreatedAtDesc(Long userId, String targetType);
}
