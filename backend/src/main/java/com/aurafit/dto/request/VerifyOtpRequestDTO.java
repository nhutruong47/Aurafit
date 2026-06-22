package com.aurafit.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Step 2 DTO — Client only needs to confirm the OTP code. The full
 * registration data was already submitted in Step 1 (request-otp) and is
 * stored in the in-memory OTP cache until this call verifies it.
 */
public record VerifyOtpRequestDTO(
        @NotBlank(message = "Email khong duoc de trong.")
        @Email(message = "Email khong dung dinh dang.")
        String email,

        @NotBlank(message = "Ma OTP khong duoc de trong.")
        @Pattern(regexp = "\\d{6}", message = "Ma OTP phai gom dung 6 chu so.")
        String otpCode
) {}
