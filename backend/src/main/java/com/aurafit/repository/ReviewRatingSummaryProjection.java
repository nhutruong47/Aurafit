package com.aurafit.repository;

public interface ReviewRatingSummaryProjection {

    Double getAverageRating();

    Long getTotalCount();

    Long getOneStarCount();

    Long getTwoStarCount();

    Long getThreeStarCount();

    Long getFourStarCount();

    Long getFiveStarCount();
}
