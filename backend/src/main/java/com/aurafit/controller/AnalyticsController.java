package com.aurafit.controller;

import com.aurafit.dto.response.DashboardMetricsDTO;
import com.aurafit.dto.response.RevenueChartDTO;
import com.aurafit.dto.response.TopCostumeDTO;
import com.aurafit.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsDTO> getDashboardMetrics() {
        return ResponseEntity.ok(analyticsService.getDashboardMetrics());
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<List<RevenueChartDTO>> getRevenueChart(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(analyticsService.getRevenueChart(startDate, endDate));
    }

    @GetMapping("/top-costumes")
    public ResponseEntity<List<TopCostumeDTO>> getTopCostumes(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(analyticsService.getTopCostumes(limit));
    }
}
