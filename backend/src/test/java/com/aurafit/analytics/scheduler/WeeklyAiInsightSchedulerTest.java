package com.aurafit.analytics.scheduler;

import com.aurafit.ai.analytics.scheduler.WeeklyAiInsightScheduler;
import com.aurafit.ai.analytics.service.AiAnalystService;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class WeeklyAiInsightSchedulerTest {

    @Test
    void generateWeeklyInsight_shouldUseCompletedPeriod() {
        AiAnalystService aiAnalystService = mock(AiAnalystService.class);
        WeeklyAiInsightScheduler scheduler = new WeeklyAiInsightScheduler(aiAnalystService);

        scheduler.generateWeeklyInsight();

        verify(aiAnalystService).generateCompletedWeeklyInsight();
    }
}
