package com.aurafit.dto.response;

import com.aurafit.entity.Costume;
import com.aurafit.entity.Event;
import com.aurafit.entity.EventCostume;
import com.aurafit.enums.EventStatus;

import java.math.BigDecimal;
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
            BigDecimal rentalPrice,
            BigDecimal discountPercentOverride
    ) {
        private static AssignedCostume fromEntity(EventCostume eventCostume) {
            Costume costume = eventCostume.getCostume();
            return new AssignedCostume(
                    eventCostume.getId(),
                    costume.getId(),
                    costume.getName(),
                    costume.getSlug(),
                    costume.getRentalPrice(),
                    eventCostume.getDiscountPercentOverride()
            );
        }
    }
}
