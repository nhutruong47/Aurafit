package com.aurafit.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Step 1 DTO — Client submits only the email to request an OTP.
 */
public record OtpRequestDTO(
        @NotBlank(message = "Email khong duoc de trong.")
        @Email(message = "Email khong dung dinh dang.")
        String email
) {}
