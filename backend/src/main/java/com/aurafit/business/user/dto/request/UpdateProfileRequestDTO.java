package com.aurafit.business.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequestDTO(
        @NotBlank(message = "Họ tên không được để trống")
        String fullName,
        String phone,
        String address,
        String bankName,
        String bankAccountNumber,
        String bankAccountName
) {}
