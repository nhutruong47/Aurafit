package com.aurafit.dto.response;

import com.aurafit.entity.CartItem;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.enums.ItemStatus;

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
        Integer rentalDays,
        BigDecimal unitPrice,
        BigDecimal rentalFee,
        BigDecimal deposit,
        BigDecimal depositPrice,
        BigDecimal subtotal,
        int availableStock
) {
    public static CartItemDTO fromEntity(CartItem cartItem, CostumeItemRepository costumeItemRepository) {
        var costumeItem = cartItem.getCostumeItem();
        var costume = costumeItem.getCostume();

        int availableStock = 1;
        if (costumeItemRepository != null) {
            availableStock = costumeItemRepository.countByCostumeIdAndSizeAndColorAndStatus(
                    costume.getId(), costumeItem.getSize(), costumeItem.getColor(), ItemStatus.AVAILABLE
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
                costume.getImageUrl(),
                cartItem.getRentalStartDate(),
                cartItem.getRentalEndDate(),
                cartItem.getRentalDays(),
                cartItem.getUnitPrice(),
                cartItem.getRentalFee(),
                cartItem.getDeposit(),
                costume.getDepositPrice(),
                cartItem.getSubtotal(),
                availableStock
        );
    }
}
