package com.aurafit.ai.analytics.service;

import com.aurafit.ai.analytics.dto.response.AiInsightResponse;

import java.util.List;

public interface AiAnalystService {

    AiInsightResponse generateWeeklyInsight();

    AiInsightResponse generateCompletedWeeklyInsight();

    List<AiInsightResponse> getLatestInsights();
}
