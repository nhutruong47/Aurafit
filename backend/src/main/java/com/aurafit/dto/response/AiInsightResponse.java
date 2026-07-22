package com.aurafit.dto.response;

import com.aurafit.entity.AiInsight;
import com.aurafit.enums.AiInsightType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AiInsightResponse(
        Long id,
        LocalDate periodStart,
        LocalDate periodEnd,
        AiInsightType insightType,
        String content,
        List<SuggestedEvent> suggestedEvents,
        LocalDateTime createdAt
) {
    public static AiInsightResponse fromEntity(
            AiInsight insight,
            List<SuggestedEvent> suggestedEvents
    ) {
        return new AiInsightResponse(
                insight.getId(),
                insight.getPeriodStart(),
                insight.getPeriodEnd(),
                insight.getInsightType(),
                insight.getContent(),
                suggestedEvents == null ? List.of() : List.copyOf(suggestedEvents),
                insight.getCreatedAt()
        );
    }

    public record SuggestedEvent(
            String name,
            String reason,
            String categorySlug,
            BigDecimal suggestedDiscountPercent,
            List<Long> costumeIds
    ) {
        public SuggestedEvent {
            costumeIds = costumeIds == null ? List.of() : List.copyOf(costumeIds);
        }
    }
}
