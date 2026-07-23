package com.aurafit.business.catalog.service.impl;

import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.Event;
import com.aurafit.business.catalog.entity.EventCostume;
import com.aurafit.business.catalog.enums.EventStatus;
import com.aurafit.business.catalog.repository.EventCostumeRepository;
import com.aurafit.business.catalog.service.EventPricingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class EventPricingServiceImpl implements EventPricingService {

    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final EventCostumeRepository eventCostumeRepository;

    public EventPricingServiceImpl(EventCostumeRepository eventCostumeRepository) {
        this.eventCostumeRepository = eventCostumeRepository;
    }

    @Override
    public Map<Long, ActiveEventOffer> findActiveOffers(List<Long> costumeIds, LocalDateTime now) {
        if (costumeIds == null || costumeIds.isEmpty() || now == null) {
            return Map.of();
        }

        List<Long> distinctCostumeIds = costumeIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (distinctCostumeIds.isEmpty()) {
            return Map.of();
        }

        List<EventCostume> assignments = eventCostumeRepository
                .findActiveEventsForCostumeIds(distinctCostumeIds, now);
        if (assignments == null || assignments.isEmpty()) {
            return Map.of();
        }

        Map<Long, ActiveEventOffer> offersByCostumeId = new LinkedHashMap<>();
        for (EventCostume assignment : assignments) {
            if (!isActiveAt(assignment, now)) {
                continue;
            }

            Costume costume = assignment.getCostume();
            Event event = assignment.getEvent();
            BigDecimal discountPercent = assignment.getDiscountPercentOverride() != null
                    ? assignment.getDiscountPercentOverride()
                    : event.getDiscountPercent();
            if (!isValidDiscount(discountPercent) || costume.getRentalPrice() == null) {
                continue;
            }

            ActiveEventOffer offer = new ActiveEventOffer(
                    event.getId(),
                    event.getName(),
                    discountPercent,
                    calculateFinalPrice(costume.getRentalPrice(), discountPercent)
            );
            offersByCostumeId.merge(costume.getId(), offer, this::selectBetterOffer);
        }
        return Map.copyOf(offersByCostumeId);
    }

    private boolean isActiveAt(EventCostume assignment, LocalDateTime now) {
        if (assignment == null || assignment.getEvent() == null || assignment.getCostume() == null) {
            return false;
        }
        Event event = assignment.getEvent();
        return event.getStatus() == EventStatus.ACTIVE
                && event.getStartDate() != null
                && !event.getStartDate().isAfter(now)
                && event.getEndDate() != null
                && !event.getEndDate().isBefore(now);
    }

    private boolean isValidDiscount(BigDecimal discountPercent) {
        return discountPercent != null
                && discountPercent.compareTo(BigDecimal.ZERO) > 0
                && discountPercent.compareTo(ONE_HUNDRED) <= 0;
    }

    private BigDecimal calculateFinalPrice(BigDecimal rentalPrice, BigDecimal discountPercent) {
        return rentalPrice
                .multiply(ONE_HUNDRED.subtract(discountPercent))
                .divide(ONE_HUNDRED, 0, RoundingMode.HALF_UP);
    }

    private ActiveEventOffer selectBetterOffer(ActiveEventOffer current, ActiveEventOffer candidate) {
        int discountComparison = candidate.discountPercent().compareTo(current.discountPercent());
        if (discountComparison != 0) {
            return discountComparison > 0 ? candidate : current;
        }
        if (current.eventId() == null) {
            return candidate;
        }
        if (candidate.eventId() == null) {
            return current;
        }
        return candidate.eventId() < current.eventId() ? candidate : current;
    }
}
