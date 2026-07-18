package com.aurafit.controller;

import com.aurafit.dto.response.AiInsightResponse;
import com.aurafit.service.stylist.AiAnalystService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics/ai-insights")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AnalyticsAiController {

    private final AiAnalystService aiAnalystService;

    public AnalyticsAiController(AiAnalystService aiAnalystService) {
        this.aiAnalystService = aiAnalystService;
    }

    @GetMapping
    public ResponseEntity<List<AiInsightResponse>> getLatestInsights() {
        return ResponseEntity.ok(aiAnalystService.getLatestInsights());
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiInsightResponse> generateWeeklyInsight() {
        return ResponseEntity.ok(aiAnalystService.generateWeeklyInsight());
    }
}
