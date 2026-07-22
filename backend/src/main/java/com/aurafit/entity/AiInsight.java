package com.aurafit.entity;

import com.aurafit.enums.AiInsightType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ai_insights")
public class AiInsight extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "insight_type", nullable = false, length = 30)
    private AiInsightType insightType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "metrics_snapshot", columnDefinition = "TEXT")
    private String metricsSnapshot;

    @Column(name = "suggested_events_json", columnDefinition = "TEXT")
    private String suggestedEventsJson;
}
