package com.aurafit.controller;

import com.aurafit.dto.request.ReviewRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.ReviewResponse;
import com.aurafit.dto.response.ReviewSummaryResponse;
import com.aurafit.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Reviews", description = "Costume rating and review endpoints")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/costumes/{costumeId}/reviews")
    @Operation(summary = "Get visible reviews for a costume")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviewsByCostume(
            @PathVariable Long costumeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer rating
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ReviewResponse> reviews = reviewService.getReviewsByCostume(costumeId, pageable, rating);
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved successfully.", reviews));
    }

    @GetMapping("/costumes/{costumeId}/reviews/summary")
    @Operation(summary = "Get visible review summary for a costume")
    public ResponseEntity<ApiResponse<ReviewSummaryResponse>> getReviewSummary(
            @PathVariable Long costumeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Review summary retrieved successfully.",
                reviewService.getReviewSummary(costumeId)
        ));
    }

    @PostMapping("/costumes/{costumeId}/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a review for a completed rental detail")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            Authentication authentication,
            @PathVariable Long costumeId,
            @Valid @RequestBody ReviewRequest request
    ) {
        ReviewResponse response = reviewService.createReview(authentication.getName(), costumeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review created successfully.", response, HttpStatus.CREATED));
    }

    @PutMapping("/reviews/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update the authenticated user's review")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Review updated successfully.",
                reviewService.updateReview(authentication.getName(), id, request)
        ));
    }

    @DeleteMapping("/reviews/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete the authenticated user's review")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            Authentication authentication,
            @PathVariable Long id
    ) {
        reviewService.deleteReview(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully.", null));
    }
}
