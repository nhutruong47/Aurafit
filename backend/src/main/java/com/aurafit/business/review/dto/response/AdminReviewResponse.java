package com.aurafit.business.review.dto.response;

import com.aurafit.business.review.enums.ReviewStatus;

import java.time.LocalDateTime;
import java.util.List;

public record AdminReviewResponse(
        Long id,
        Long costumeId,
        String costumeName,
        Long userId,
        String userFullName,
        int rating,
        String comment,
        ReviewStatus status,
        LocalDateTime createdAt,
        List<String> imageUrls
) {
}
