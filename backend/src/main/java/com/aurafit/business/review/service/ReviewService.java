package com.aurafit.business.review.service;

import com.aurafit.business.review.dto.request.ReviewRequest;
import com.aurafit.business.review.dto.response.AdminReviewResponse;
import com.aurafit.business.review.dto.response.ReviewResponse;
import com.aurafit.business.review.dto.response.ReviewSummaryResponse;
import com.aurafit.business.review.enums.ReviewStatus;
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
