package com.aurafit.dto.response;

import com.aurafit.entity.CartItem;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.service.EventPricingService.ActiveEventOffer;
import com.aurafit.service.PricingEngineService.PriceBreakdown;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Represents a single item in the user's cart.
 * Flattens the CostumeItem → Costume hierarchy for frontend consumption.
 */
public record CartItemDTO(
        Long id,
        Long costumeItemId,
        Long costumeId,
        String costumeName,
        String sku,
        String size,
        String color,
        String imageUrl,
        List<String> imageUrls,
        LocalDate rentalStartDate,
        LocalDate rentalEndDate,
        Integer rentalDays,
        BigDecimal originalUnitPrice,
        BigDecimal unitPrice,
        BigDecimal originalRentalFee,
        BigDecimal rentalFee,
        BigDecimal discountPercent,
        BigDecimal discountAmount,
        String eventName,
        BigDecimal deposit,
        BigDecimal depositPrice,
        BigDecimal subtotal,
        int availableStock
) {
    public static CartItemDTO fromEntity(CartItem cartItem,
                                         CostumeItemRepository costumeItemRepository,
                                         PriceBreakdown pricing,
                                         ActiveEventOffer activeOffer) {
        var costumeItem = cartItem.getCostumeItem();
        var costume = costumeItem.getCostume();

        int availableStock = 1;
        if (costumeItemRepository != null) {
            availableStock = costumeItemRepository.countPooledByCostumeIdAndSizeAndColor(
                    costume.getId(), costumeItem.getSize(), costumeItem.getColor()
            );
        }

        return new CartItemDTO(
                cartItem.getId(),
                costumeItem.getId(),
                costume.getId(),
                costume.getName(),
                costumeItem.getSku(),
                costumeItem.getSize(),
                costumeItem.getColor(),
                costume.getPrimaryImageUrl(),
                costume.getAllImageUrls(),
                cartItem.getRentalStartDate(),
                cartItem.getRentalEndDate(),
                cartItem.getRentalDays(),
                pricing.originalUnitPrice(),
                pricing.effectiveUnitPrice(),
                pricing.originalRentalFee(),
                pricing.rentalFee(),
                activeOffer != null ? activeOffer.discountPercent() : null,
                pricing.discountAmount(),
                activeOffer != null ? activeOffer.eventName() : null,
                pricing.deposit(),
                costume.getDepositPrice(),
                pricing.total(),
                availableStock
        );
    }
}
