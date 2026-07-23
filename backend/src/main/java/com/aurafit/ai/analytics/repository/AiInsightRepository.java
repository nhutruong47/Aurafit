package com.aurafit.ai.analytics.repository;

import com.aurafit.ai.analytics.entity.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {

    List<AiInsight> findTop10ByOrderByCreatedAtDesc();
}
