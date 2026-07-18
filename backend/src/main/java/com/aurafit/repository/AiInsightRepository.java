package com.aurafit.repository;

import com.aurafit.entity.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {

    List<AiInsight> findTop10ByOrderByCreatedAtDesc();
}
