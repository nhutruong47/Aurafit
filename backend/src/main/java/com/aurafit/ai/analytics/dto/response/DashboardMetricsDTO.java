package com.aurafit.ai.analytics.dto.response;

import java.math.BigDecimal;

public record DashboardMetricsDTO(
        BigDecimal totalRevenue,
        Long totalOrders,
        Long totalUsers,
        Long pendingOrdersCount,
        Long totalCostumes,
        Long totalCategories
) {}
