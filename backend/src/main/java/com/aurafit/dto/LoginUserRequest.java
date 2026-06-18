package com.aurafit.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginUserRequest(
        @Email @NotBlank String email,
        @NotBlank String password
) {
}
