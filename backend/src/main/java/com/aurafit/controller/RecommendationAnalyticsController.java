package com.aurafit.controller;

import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.RecommendationAnalyticsDTO;
import com.aurafit.service.RecommendationAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
@Tag(name = "Recommendation Analytics", description = "Admin analytics for recommendation and AI Stylist performance")
public class RecommendationAnalyticsController {

    private final RecommendationAnalyticsService recommendationAnalyticsService;

    public RecommendationAnalyticsController(RecommendationAnalyticsService recommendationAnalyticsService) {
        this.recommendationAnalyticsService = recommendationAnalyticsService;
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get recommendation analytics for admin")
    public ResponseEntity<ApiResponse<RecommendationAnalyticsDTO>> getAnalytics(
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Recommendation analytics retrieved successfully.",
                        recommendationAnalyticsService.getAnalytics(days)
                )
        );
    }
}
