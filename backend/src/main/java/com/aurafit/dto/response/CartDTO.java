package com.aurafit.dto.response;

import com.aurafit.entity.Cart;
import com.aurafit.enums.CartStatus;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full cart representation for the frontend.
 * Contains all items and the cart's total value.
 */
public record CartDTO(
        Long id,
        Long userId,
        CartStatus status,
        List<CartItemDTO> items,
        BigDecimal totalOriginalRentalFee,
        BigDecimal totalRentalFee,
        BigDecimal totalDiscount,
        BigDecimal totalDeposit,
        BigDecimal totalCartValue
) {
    public static CartDTO fromEntity(Cart cart, List<CartItemDTO> itemDTOs) {
        BigDecimal totalOriginalRentalFee = itemDTOs.stream()
                .map(CartItemDTO::originalRentalFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRentalFee = itemDTOs.stream()
                .map(CartItemDTO::rentalFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDiscount = itemDTOs.stream()
                .map(CartItemDTO::discountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDeposit = itemDTOs.stream()
                .map(CartItemDTO::deposit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartDTO(
                cart.getId(),
                cart.getUser().getId(),
                cart.getStatus(),
                itemDTOs,
                totalOriginalRentalFee,
                totalRentalFee,
                totalDiscount,
                totalDeposit,
                totalRentalFee.add(totalDeposit)
        );
    }
}
