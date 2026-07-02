package com.aurafit.dto.response;

import com.aurafit.entity.Cart;
import com.aurafit.enums.CartStatus;
import com.aurafit.repository.CostumeItemRepository;

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
        BigDecimal totalRentalFee,
        BigDecimal totalDeposit,
        BigDecimal totalCartValue
) {
    public static CartDTO fromEntity(Cart cart, CostumeItemRepository costumeItemRepository) {
        List<CartItemDTO> itemDTOs = cart.getItems()
                .stream()
                .map(item -> CartItemDTO.fromEntity(item, costumeItemRepository))
                .toList();

        return new CartDTO(
                cart.getId(),
                cart.getUser().getId(),
                cart.getStatus(),
                itemDTOs,
                cart.getTotalRentalFee(),
                cart.getTotalDeposit(),
                cart.getTotalValue()
        );
    }
}
