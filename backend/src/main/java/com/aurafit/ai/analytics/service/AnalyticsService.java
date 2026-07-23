package com.aurafit.ai.analytics.service;

import com.aurafit.ai.analytics.dto.response.DashboardMetricsDTO;
import com.aurafit.common.dto.response.PaginatedResponse;
import com.aurafit.ai.analytics.dto.response.RevenueChartDTO;
import com.aurafit.ai.analytics.dto.response.RevenueTransactionDTO;
import com.aurafit.ai.analytics.dto.response.TopCostumeDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface AnalyticsService {
    DashboardMetricsDTO getDashboardMetrics();

    List<RevenueChartDTO> getRevenueChart(LocalDateTime startDate, LocalDateTime endDate);

    PaginatedResponse<RevenueTransactionDTO> getRevenueTransactions(
            int page,
            int size,
            String keyword,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    List<TopCostumeDTO> getTopCostumes(int limit);
}
