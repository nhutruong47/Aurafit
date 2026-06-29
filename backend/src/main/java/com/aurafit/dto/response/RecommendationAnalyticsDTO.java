package com.aurafit.dto.response;

import java.util.List;

public record RecommendationAnalyticsDTO(
        int periodDays,
        String startDate,
        String endDate,
        Overview overview,
        List<SlotPerformance> slotPerformance,
        AiStylistPerformance aiStylist,
        List<TopCostume> topClickedCostumes,
        List<DailyPerformance> dailyPerformance,
        String generatedAt
) {
    public record Overview(
            int totalInteractions,
            int productViews,
            int searches,
            int recommendationImpressions,
            int recommendationClicks,
            double recommendationCtr,
            int addToCarts,
            int rents
    ) {
    }

    public record SlotPerformance(
            String slot,
            int impressions,
            int clicks,
            double ctr
    ) {
    }

    public record AiStylistPerformance(
            int sessionsStarted,
            int userMessages,
            int assistantMessages,
            int recommendationImpressions,
            int recommendationClicks,
            double recommendationCtr,
            int attributedAddToCarts,
            int attributedRents
    ) {
    }

    public record TopCostume(
            Long costumeId,
            String costumeName,
            int clickCount
    ) {
    }

    public record DailyPerformance(
            String date,
            int recommendationImpressions,
            int recommendationClicks,
            int aiChatQueries,
            int aiAttributedRents
    ) {
    }
}
