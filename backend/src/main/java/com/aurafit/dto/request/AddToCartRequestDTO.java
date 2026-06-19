package com.aurafit.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request body for adding a physical costume item to the cart.
 * Since each CostumeItem is a unique physical unit (unique SKU),
 * the rental quantity is implicitly 1 per item.
 */
public record AddToCartRequestDTO(

        @NotNull(message = "costumeItemId is required")
        Long costumeItemId,

        @NotNull(message = "rentalStartDate is required")
        @FutureOrPresent(message = "rentalStartDate must be today or in the future")
        LocalDate rentalStartDate,

        @NotNull(message = "rentalEndDate is required")
        @Future(message = "rentalEndDate must be in the future")
        LocalDate rentalEndDate
) {}
