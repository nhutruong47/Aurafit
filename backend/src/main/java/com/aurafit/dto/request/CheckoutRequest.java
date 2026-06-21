package com.aurafit.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Unified checkout request consumed by the single POST /api/orders/checkout endpoint.
 *
 * Frontend is responsible for packaging the payload:
 * - "Thuê Ngay"  → single-item list:  [ { sku: "...", quantity: 1, rentalStartDate: ..., rentalEndDate: ... } ]
 * - "Đặt đơn từ giỏ" → multi-item list: one entry per SKU the user selected
 *
 * The user's active cart is never touched directly by this endpoint;
 * instead the cart is cleaned up in step 5 of the service layer only
 * for the SKUs that appear in the order.
 */
public record CheckoutRequest(

        @NotBlank(message = "receiverName is required")
        String receiverName,

        @NotBlank(message = "receiverPhone is required")
        String receiverPhone,

        @NotBlank(message = "deliveryAddress is required")
        String deliveryAddress,

        @NotEmpty(message = "items must not be empty")
        @Valid
        List<CheckoutItemRequest> items
) {}
