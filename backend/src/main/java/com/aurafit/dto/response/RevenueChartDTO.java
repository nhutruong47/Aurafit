package com.aurafit.dto.response;

import java.math.BigDecimal;

public record RevenueChartDTO(
        String date,
        BigDecimal dailyRevenue
) {}
