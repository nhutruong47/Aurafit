package com.aurafit.business.review.controller;

import com.aurafit.common.dto.response.ApiResponse;
import com.aurafit.business.review.dto.response.AdminReviewResponse;
import com.aurafit.business.review.dto.response.ReviewResponse;
import com.aurafit.business.review.enums.ReviewStatus;
import com.aurafit.business.review.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reviews")
@Tag(name = "Admin Reviews", description = "Administrative review moderation endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AdminReviewController {

    private final ReviewService reviewService;

    public AdminReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List reviews for moderation")
    public ResponseEntity<ApiResponse<Page<AdminReviewResponse>>> getReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String costumeName
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(
                "Admin reviews retrieved successfully.",
                reviewService.getAdminReviews(pageable, status, rating, costumeName)
        ));
    }

    @PatchMapping("/{id}/hide")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hide a review from public views")
    public ResponseEntity<ApiResponse<ReviewResponse>> hideReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Review hidden successfully.",
                reviewService.hideReviewByAdmin(id)
        ));
    }

    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Restore a hidden review")
    public ResponseEntity<ApiResponse<ReviewResponse>> restoreReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Review restored successfully.",
                reviewService.restoreReview(id)
        ));
    }
}
