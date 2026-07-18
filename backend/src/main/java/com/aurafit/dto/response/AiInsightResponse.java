package com.aurafit.dto.response;

import com.aurafit.entity.AiInsight;
import com.aurafit.enums.AiInsightType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AiInsightResponse(
        Long id,
        LocalDate periodStart,
        LocalDate periodEnd,
        AiInsightType insightType,
        String content,
        LocalDateTime createdAt
) {
    public static AiInsightResponse fromEntity(AiInsight insight) {
        return new AiInsightResponse(
                insight.getId(),
                insight.getPeriodStart(),
                insight.getPeriodEnd(),
                insight.getInsightType(),
                insight.getContent(),
                insight.getCreatedAt()
        );
    }
}
