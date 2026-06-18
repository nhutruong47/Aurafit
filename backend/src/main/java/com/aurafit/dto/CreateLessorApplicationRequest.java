package com.aurafit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateLessorApplicationRequest(
        @NotNull Long userId,
        @NotBlank String shopName,
        @NotBlank String shopAddress,
        @NotBlank String citizenIdImageUrl,
        @NotBlank String bankAccountNumber
) {
}
