package com.aurafit.service;

import com.aurafit.dto.response.RecommendationAnalyticsDTO;

public interface RecommendationAnalyticsService {

    RecommendationAnalyticsDTO getAnalytics(int days);
}
