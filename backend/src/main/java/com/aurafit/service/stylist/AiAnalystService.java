package com.aurafit.service.stylist;

import com.aurafit.dto.response.AiInsightResponse;

import java.util.List;

public interface AiAnalystService {

    AiInsightResponse generateWeeklyInsight();

    List<AiInsightResponse> getLatestInsights();
}
