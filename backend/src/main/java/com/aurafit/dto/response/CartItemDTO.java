package com.aurafit.dto.response;

import com.aurafit.entity.CartItem;

import java.math.BigDecimal;
import java.time.LocalDate;

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
        LocalDate rentalStartDate,
        LocalDate rentalEndDate,
        int rentalDays,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public static CartItemDTO fromEntity(CartItem cartItem) {
        var costumeItem = cartItem.getCostumeItem();
        var costume = costumeItem.getCostume();

        return new CartItemDTO(
                cartItem.getId(),
                costumeItem.getId(),
                costume.getId(),
                costume.getName(),
                costumeItem.getSku(),
                costumeItem.getSize(),
                costumeItem.getColor(),
                costume.getImageUrl(),
                cartItem.getRentalStartDate(),
                cartItem.getRentalEndDate(),
                cartItem.getRentalDays(),
                cartItem.getUnitPrice(),
                cartItem.getSubtotal()
        );
    }
}
