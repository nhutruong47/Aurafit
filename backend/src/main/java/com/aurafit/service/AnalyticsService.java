package com.aurafit.service;

import com.aurafit.dto.response.DashboardMetricsDTO;
import com.aurafit.dto.response.RevenueChartDTO;
import com.aurafit.dto.response.TopCostumeDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface AnalyticsService {
    DashboardMetricsDTO getDashboardMetrics();

    List<RevenueChartDTO> getRevenueChart(LocalDateTime startDate, LocalDateTime endDate);

    List<TopCostumeDTO> getTopCostumes(int limit);
}
