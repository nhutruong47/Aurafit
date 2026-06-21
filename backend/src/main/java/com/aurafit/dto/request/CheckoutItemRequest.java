package com.aurafit.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Represents a single line item submitted during checkout.
 * Each record carries the SKU of a physical costume item along with
 * its rental window and quantity (quantity defaults to 1 for single-item orders).
 */
public record CheckoutItemRequest(

        @NotBlank(message = "SKU is required")
        String sku,

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        Integer quantity,

        @NotNull(message = "rentalStartDate is required")
        LocalDate rentalStartDate,

        @NotNull(message = "rentalEndDate is required")
        LocalDate rentalEndDate
) {}
