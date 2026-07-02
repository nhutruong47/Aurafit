package com.aurafit.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request body for updating rental dates of an existing CartItem.
 * The costumeItemId mapping is NOT changed — only the rental period is updated.
 */
public record UpdateCartItemRequestDTO(

        @NotNull(message = "rentalStartDate is required")
        @FutureOrPresent(message = "rentalStartDate must be today or in the future")
        LocalDate rentalStartDate,

        @NotNull(message = "rentalEndDate is required")
        @Future(message = "rentalEndDate must be in the future")
        LocalDate rentalEndDate
) {}
