package com.aurafit.ai.analytics.repository;

import com.aurafit.ai.analytics.entity.AiInsight;
import com.aurafit.ai.analytics.enums.AiInsightType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {

    List<AiInsight> findTop10ByOrderByCreatedAtDesc();

    Optional<AiInsight> findFirstByPeriodStartAndPeriodEndAndInsightTypeOrderByCreatedAtDesc(
            LocalDate periodStart,
            LocalDate periodEnd,
            AiInsightType insightType
    );
}
