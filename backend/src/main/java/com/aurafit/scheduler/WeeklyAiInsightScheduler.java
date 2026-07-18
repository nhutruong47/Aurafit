package com.aurafit.scheduler;

import com.aurafit.service.stylist.AiAnalystService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class WeeklyAiInsightScheduler {

    private final AiAnalystService aiAnalystService;

    public WeeklyAiInsightScheduler(AiAnalystService aiAnalystService) {
        this.aiAnalystService = aiAnalystService;
    }

    @Scheduled(cron = "0 0 6 * * MON", zone = "Asia/Ho_Chi_Minh")
    public void generateWeeklyInsight() {
        aiAnalystService.generateWeeklyInsight();
    }
}
