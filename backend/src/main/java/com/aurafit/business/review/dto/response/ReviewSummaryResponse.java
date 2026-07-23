package com.aurafit.business.review.dto.response;

import java.util.Map;

public record ReviewSummaryResponse(
        Double averageRating,
        Long totalCount,
        Map<Integer, Long> ratingDistribution
) {
}
