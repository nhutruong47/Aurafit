package com.aurafit.business.catalog.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface EventPricingService {

    Map<Long, ActiveEventOffer> findActiveOffers(List<Long> costumeIds, LocalDateTime now);

    record ActiveEventOffer(
            Long eventId,
            String eventName,
            BigDecimal discountPercent,
            BigDecimal finalPrice
    ) {
    }
}
