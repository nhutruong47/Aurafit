package com.aurafit.service;

import com.aurafit.dto.request.ReviewRequest;
import com.aurafit.dto.response.AdminReviewResponse;
import com.aurafit.dto.response.ReviewResponse;
import com.aurafit.dto.response.ReviewSummaryResponse;
import com.aurafit.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    ReviewResponse createReview(String userEmail, ReviewRequest request);

    ReviewResponse createReview(String userEmail, Long costumeId, ReviewRequest request);

    ReviewResponse updateReview(String userEmail, Long reviewId, ReviewRequest request);

    void deleteReview(String userEmail, Long reviewId);

    Page<ReviewResponse> getReviewsByCostume(Long costumeId, Pageable pageable, Integer ratingFilter);

    ReviewSummaryResponse getReviewSummary(Long costumeId);

    Page<AdminReviewResponse> getAdminReviews(
            Pageable pageable,
            ReviewStatus status,
            Integer rating,
            String costumeName
    );

    ReviewResponse hideReviewByAdmin(Long reviewId);

    ReviewResponse restoreReview(Long reviewId);
}
