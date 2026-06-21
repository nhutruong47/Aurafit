package com.aurafit.service;

import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.OrderResponse;

/**
 * Unified checkout service consumed by a single POST /api/orders/checkout endpoint.
 *
 * <p>All user identity is extracted from the JWT SecurityContext (IDOR-safe).
 * The same endpoint handles both "Thuê Ngay" (single-item) and
 * "Đặt đơn từ giỏ hàng" (multi-item) flows:
 * <ul>
 *   <li>Frontend sends a list of {@link com.aurafit.dto.request.CheckoutItemRequest}
 *       containing SKU + rental dates + quantity.</li>
 *   <li>The service locates each physical CostumeItem by SKU, validates stock,
 *       computes financials, locks inventory, creates the order, and
 *       removes only the successfully-ordered SKUs from the user's active cart.</li>
 * </ul>
 */
public interface CheckoutService {

    /**
     * Creates a PENDING RentalOrder from a list of SKUs.
     *
     * @param userId  Always extracted from SecurityContext — never from request body.
     * @param request Contains receiver info and a non-empty list of checkout items.
     * @return Full order details including line items and computed totals.
     */
    OrderResponse checkout(Long userId, CheckoutRequest request);
}
