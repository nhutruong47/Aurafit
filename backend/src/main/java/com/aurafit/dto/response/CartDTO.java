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
        BigDecimal totalCartValue
) {
    public static CartDTO fromEntity(Cart cart) {
        List<CartItemDTO> itemDTOs = cart.getItems()
                .stream()
                .map(CartItemDTO::fromEntity)
                .toList();

        return new CartDTO(
                cart.getId(),
                cart.getUser().getId(),
                cart.getStatus(),
                itemDTOs,
                cart.getTotalValue()
        );
    }
}
