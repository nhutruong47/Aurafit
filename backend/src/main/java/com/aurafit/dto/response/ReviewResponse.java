package com.aurafit.dto.response;

import com.aurafit.enums.ReviewStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ReviewResponse(
        Long id,
        Long userId,
        String userFullName,
        int rating,
        String comment,
        ReviewStatus status,
        LocalDateTime createdAt,
        List<String> imageUrls
) {
}
