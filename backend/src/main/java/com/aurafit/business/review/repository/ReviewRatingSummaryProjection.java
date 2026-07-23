package com.aurafit.business.review.repository;

public interface ReviewRatingSummaryProjection {

    Double getAverageRating();

    Long getTotalCount();

    Long getOneStarCount();

    Long getTwoStarCount();

    Long getThreeStarCount();

    Long getFourStarCount();

    Long getFiveStarCount();
}
