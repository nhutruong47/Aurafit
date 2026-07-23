package com.aurafit.dto.response;

import com.aurafit.entity.Event;
import com.aurafit.enums.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventBannerResponse(
        Long id,
        String name,
        String slug,
        String bannerImageUrl,
        String sideBannerImageUrl,
        BigDecimal discountPercent,
        LocalDateTime startDate,
        LocalDateTime endDate,
        EventStatus status,
        boolean isOngoing
) {
    public static EventBannerResponse fromEntity(Event event, LocalDateTime now) {
        boolean ongoing = !event.getStartDate().isAfter(now)
                && !event.getEndDate().isBefore(now);
        return new EventBannerResponse(
                event.getId(),
                event.getName(),
                event.getSlug(),
                event.getBannerImageUrl(),
                event.getSideBannerImageUrl(),
                event.getDiscountPercent(),
                event.getStartDate(),
                event.getEndDate(),
                event.getStatus(),
                ongoing
        );
    }
}
