package com.aurafit.business.catalog.dto.response;

import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.Event;
import com.aurafit.business.catalog.entity.EventCostume;
import com.aurafit.business.catalog.enums.EventStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

public record EventResponse(
        Long id,
        String name,
        String slug,
        String description,
        String bannerImageUrl,
        String sideBannerImageUrl,
        BigDecimal discountPercent,
        LocalDateTime startDate,
        LocalDateTime endDate,
        EventStatus status,
        List<AssignedCostume> costumes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static EventResponse fromEntity(Event event, List<EventCostume> eventCostumes) {
        List<AssignedCostume> assignedCostumes = eventCostumes == null
                ? List.of()
                : eventCostumes.stream()
                        .map(AssignedCostume::fromEntity)
                        .toList();

        return new EventResponse(
                event.getId(),
                event.getName(),
                event.getSlug(),
                event.getDescription(),
                event.getBannerImageUrl(),
                event.getSideBannerImageUrl(),
                event.getDiscountPercent(),
                event.getStartDate(),
                event.getEndDate(),
                event.getStatus(),
                assignedCostumes,
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }

    public record AssignedCostume(
            Long id,
            Long costumeId,
            String costumeName,
            String costumeSlug,
            String imageUrl,
            BigDecimal rentalPrice,
            BigDecimal discountPercentOverride,
            BigDecimal appliedDiscountPercent,
            BigDecimal finalPrice
    ) {
        private static AssignedCostume fromEntity(EventCostume eventCostume) {
            Costume costume = eventCostume.getCostume();
            BigDecimal appliedDiscountPercent = eventCostume.getDiscountPercentOverride() != null
                    ? eventCostume.getDiscountPercentOverride()
                    : eventCostume.getEvent().getDiscountPercent();
            BigDecimal finalPrice = calculateFinalPrice(costume.getRentalPrice(), appliedDiscountPercent);
            return new AssignedCostume(
                    eventCostume.getId(),
                    costume.getId(),
                    costume.getName(),
                    costume.getSlug(),
                    costume.getPrimaryImageUrl(),
                    costume.getRentalPrice(),
                    eventCostume.getDiscountPercentOverride(),
                    appliedDiscountPercent,
                    finalPrice
            );
        }

        private static BigDecimal calculateFinalPrice(
                BigDecimal rentalPrice,
                BigDecimal discountPercent
        ) {
            if (rentalPrice == null || discountPercent == null) {
                return rentalPrice;
            }
            return rentalPrice
                    .multiply(BigDecimal.valueOf(100).subtract(discountPercent))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        }
    }
}
