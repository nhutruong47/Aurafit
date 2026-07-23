package com.aurafit.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Enterprise-grade Tiered Rental Pricing Engine.
 *
 * Formulas:
 * - Duration Multiplier: Days 1-2 = 1.0x. Days 3+ = 1.0 + (days - 2) * 0.2
 * - Rental Fee = basePrice * multiplier * quantity
 * - Deposit = (retailValue * 1.2 * quantity) - rentalFee  (minimum 0)
 * - Total = rentalFee + deposit
 *
 * The 120% rule ensures total collateral covers the retail value to prevent theft.
 */
@Service
public class PricingEngineService {

    private static final BigDecimal BASE_MULTIPLIER = BigDecimal.ONE;
    private static final BigDecimal STEP_MULTIPLIER = new BigDecimal("0.2");
    private static final int TIER_THRESHOLD_DAYS = 2;
    private static final BigDecimal COLLATERAL_RATIO = new BigDecimal("1.2");

    /**
     * Calculate the tiered duration multiplier.
     * Days 1-2: 1.0x
     * Day 3: 1.2x, Day 4: 1.4x, Day 5: 1.6x, etc.
     */
    public BigDecimal calculateDurationMultiplier(int days) {
        if (days <= 0) return BASE_MULTIPLIER;
        if (days <= TIER_THRESHOLD_DAYS) return BASE_MULTIPLIER;
        int extraDays = days - TIER_THRESHOLD_DAYS;
        return BASE_MULTIPLIER.add(STEP_MULTIPLIER.multiply(BigDecimal.valueOf(extraDays)));
    }

    /**
     * Calculate rental fee for an item.
     * rentalFee = basePrice * multiplier * quantity
     */
    public BigDecimal calculateItemRentalFee(BigDecimal basePrice, int days, int quantity) {
        if (basePrice == null) return BigDecimal.ZERO;
        BigDecimal multiplier = calculateDurationMultiplier(days);
        return basePrice.multiply(multiplier)
                .multiply(BigDecimal.valueOf(quantity))
                .setScale(0, RoundingMode.HALF_UP);
    }

    /**
     * Calculate deposit for an item.
     * deposit = (retailValue * 1.2 * quantity) - rentalFee
     * Deposit cannot be negative.
     */
    public BigDecimal calculateItemDeposit(BigDecimal retailValue, BigDecimal rentalFee, int quantity) {
        if (retailValue == null) return BigDecimal.ZERO;
        BigDecimal totalCollateral = retailValue.multiply(COLLATERAL_RATIO)
                .multiply(BigDecimal.valueOf(quantity))
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal deposit = totalCollateral.subtract(rentalFee);
        return deposit.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : deposit;
    }

    /**
     * Calculate total checkout amount.
     * total = rentalFee + deposit
     */
    public BigDecimal calculateTotal(BigDecimal rentalFee, BigDecimal deposit) {
        return rentalFee.add(deposit);
    }

    /**
     * Calculates an authoritative rental breakdown while keeping the refundable
     * deposit based on the original rental fee. Event discounts reduce only the
     * rental charge and must never be converted into a higher deposit.
     */
    public PriceBreakdown calculateItemPricing(BigDecimal originalUnitPrice,
                                               BigDecimal effectiveUnitPrice,
                                               BigDecimal retailValue,
                                               int days,
                                               int quantity) {
        BigDecimal safeOriginalUnitPrice = originalUnitPrice != null
                ? originalUnitPrice.max(BigDecimal.ZERO)
                : BigDecimal.ZERO;
        BigDecimal safeEffectiveUnitPrice = effectiveUnitPrice != null
                ? effectiveUnitPrice.max(BigDecimal.ZERO).min(safeOriginalUnitPrice)
                : safeOriginalUnitPrice;

        BigDecimal originalRentalFee = calculateItemRentalFee(
                safeOriginalUnitPrice,
                days,
                quantity
        );
        BigDecimal rentalFee = calculateItemRentalFee(
                safeEffectiveUnitPrice,
                days,
                quantity
        );
        BigDecimal discountAmount = originalRentalFee.subtract(rentalFee).max(BigDecimal.ZERO);
        BigDecimal deposit = calculateItemDeposit(retailValue, originalRentalFee, quantity);

        return new PriceBreakdown(
                safeOriginalUnitPrice,
                safeEffectiveUnitPrice,
                originalRentalFee,
                rentalFee,
                deposit,
                discountAmount,
                calculateTotal(rentalFee, deposit)
        );
    }

    public record PriceBreakdown(
            BigDecimal originalUnitPrice,
            BigDecimal effectiveUnitPrice,
            BigDecimal originalRentalFee,
            BigDecimal rentalFee,
            BigDecimal deposit,
            BigDecimal discountAmount,
            BigDecimal total
    ) {
    }
}
