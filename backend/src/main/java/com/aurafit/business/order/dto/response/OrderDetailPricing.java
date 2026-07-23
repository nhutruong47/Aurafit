package com.aurafit.business.order.dto.response;

import com.aurafit.business.order.entity.RentalOrderDetail;

import java.math.BigDecimal;
import java.math.RoundingMode;

final class OrderDetailPricing {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private OrderDetailPricing() {
    }

    static Values from(RentalOrderDetail detail) {
        BigDecimal originalRentalFee = zeroIfNull(detail.getSubtotal());
        BigDecimal discountedRentalFee = zeroIfNull(detail.getPrice())
                .subtract(zeroIfNull(detail.getDeposit()))
                .max(BigDecimal.ZERO);
        BigDecimal discountAmount = originalRentalFee
                .subtract(discountedRentalFee)
                .max(BigDecimal.ZERO);

        BigDecimal discountPercent = detail.getDiscountPercent();
        if (discountPercent == null && originalRentalFee.signum() > 0 && discountAmount.signum() > 0) {
            discountPercent = discountAmount
                    .multiply(ONE_HUNDRED)
                    .divide(originalRentalFee, 2, RoundingMode.HALF_UP);
        }

        return new Values(
                originalRentalFee,
                discountedRentalFee,
                discountAmount,
                discountPercent
        );
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    record Values(
            BigDecimal originalRentalFee,
            BigDecimal rentalFee,
            BigDecimal discountAmount,
            BigDecimal discountPercent
    ) {
    }
}
