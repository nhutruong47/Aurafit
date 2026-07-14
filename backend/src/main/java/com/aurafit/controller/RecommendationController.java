package com.aurafit.controller;

import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;
import com.aurafit.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@Tag(name = "Recommendation", description = "Recommendation and similarity endpoints")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/home")
    @Operation(summary = "Get personalized homepage recommendations")
    public ResponseEntity<ApiResponse<List<SimilarCostumeRecommendationDTO>>> getHomepageRecommendations(
            @RequestParam(required = false) String sessionId,
            @RequestParam(defaultValue = "6") int limit,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Homepage recommendations retrieved successfully.",
                        recommendationService.getHomepageRecommendations(resolveAuthenticatedEmail(authentication), sessionId, limit)
                )
        );
    }

    @GetMapping("/similar/{costumeId}")
    @Operation(summary = "Get similar costumes by costume ID")
    public ResponseEntity<ApiResponse<List<SimilarCostumeRecommendationDTO>>> getSimilarCostumes(
            @PathVariable Long costumeId,
            @RequestParam(required = false) String sessionId,
            @RequestParam(defaultValue = "4") int limit,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Similar costumes retrieved successfully.",
                        recommendationService.getSimilarCostumes(
                                costumeId,
                                limit,
                                resolveAuthenticatedEmail(authentication),
                                sessionId
                        )
                )
        );
    }

    private String resolveAuthenticatedEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        return authentication.getName();
    }
}
