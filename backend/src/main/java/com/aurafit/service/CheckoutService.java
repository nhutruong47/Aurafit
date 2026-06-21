package com.aurafit.service;

import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.OrderResponse;

public interface CheckoutService {

    /**
     * Converts the user's active cart into a RentalOrder.
     *
     * - Extracts user identity from JWT (IDOR-safe).
     * - Validates cart exists and is non-empty.
     * - Checks stock availability for every CartItem.
     * - Calculates financial totals (rental price, deposit, discount = 0).
     * - Persists the order and locks inventory in a single transaction.
     *
     * @param userId  Extracted from SecurityContext, never from the request body.
     * @param request Contains receiver name, phone, and delivery address.
     * @return Full order details including line items.
     */
    OrderResponse checkout(Long userId, CheckoutRequest request);
}
