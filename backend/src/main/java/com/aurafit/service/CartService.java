package com.aurafit.service;

import com.aurafit.dto.request.AddToCartRequestDTO;
import com.aurafit.dto.request.UpdateCartItemRequestDTO;
import com.aurafit.dto.response.CartDTO;

public interface CartService {

    /**
     * Fetches the user's ACTIVE cart. Creates a new empty cart if none exists.
     */
    CartDTO getCart(Long userId);

    /**
     * Adds a CostumeItem to the user's cart with the specified rental period.
     * Validates availability, calculates pricing, and returns the updated cart.
     */
    CartDTO addToCart(Long userId, AddToCartRequestDTO request);

    /**
     * Updates the rental dates of an existing CartItem.
     * Recalculates pricing and returns the updated cart.
     */
    CartDTO updateCartItem(Long userId, Long cartItemId, UpdateCartItemRequestDTO request);

    /**
     * Removes a CartItem from the user's cart and returns the updated cart.
     */
    CartDTO removeItemFromCart(Long userId, Long cartItemId);
}
