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
        @NotBlank(message = "Vui lòng cung cấp địa chỉ email.")
        @Email(message = "Địa chỉ email không đúng định dạng.")
        String email,

        @NotBlank(message = "Mã OTP không được để trống.")
        @Pattern(regexp = "\\d{6}", message = "Mã OTP phải gồm đúng 6 chữ số.")
        String otpCode
) {}
