package com.aurafit.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PricingEngineServiceTest {

    private final PricingEngineService pricingEngineService = new PricingEngineService();

    @Test
    void calculateItemPricing_shouldDiscountRentalWithoutIncreasingDeposit() {
        PricingEngineService.PriceBreakdown pricing = pricingEngineService.calculateItemPricing(
                new BigDecimal("100000"),
                new BigDecimal("80000"),
                new BigDecimal("500000"),
                2,
                1
        );

        assertEquals(new BigDecimal("100000"), pricing.originalRentalFee());
        assertEquals(new BigDecimal("80000"), pricing.rentalFee());
        assertEquals(new BigDecimal("20000"), pricing.discountAmount());
        assertEquals(new BigDecimal("500000"), pricing.deposit());
        assertEquals(new BigDecimal("580000"), pricing.total());
    }

    @Test
    void calculateItemPricing_shouldApplyDurationMultiplierToDiscountedPrice() {
        PricingEngineService.PriceBreakdown pricing = pricingEngineService.calculateItemPricing(
                new BigDecimal("100000"),
                new BigDecimal("75000"),
                new BigDecimal("500000"),
                4,
                2
        );

        assertEquals(new BigDecimal("280000"), pricing.originalRentalFee());
        assertEquals(new BigDecimal("210000"), pricing.rentalFee());
        assertEquals(new BigDecimal("70000"), pricing.discountAmount());
        assertEquals(new BigDecimal("920000"), pricing.deposit());
        assertEquals(new BigDecimal("1130000"), pricing.total());
    }
}
