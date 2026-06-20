package com.aurafit.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Step 2 DTO — Client submits email, OTP, and full account information
 * to complete the 2-step registration in a single call.
 */
public record VerifyOtpRequestDTO(
        @NotBlank(message = "Email khong duoc de trong.")
        @Email(message = "Email khong dung dinh dang.")
        String email,

        @NotBlank(message = "Ma OTP khong duoc de trong.")
        @Pattern(regexp = "\\d{6}", message = "Ma OTP phai gom dung 6 chu so.")
        String otpCode,

        @NotBlank(message = "Ho ten khong duoc de trong.")
        String fullName,

        @NotBlank(message = "So dien thoai khong duoc de trong.")
        @Pattern(regexp = "0\\d{9}", message = "So dien thoai phai gom 10 chu so va bat dau bang 0.")
        String phone,

        @NotBlank(message = "Mat khau khong duoc de trong.")
        @Size(min = 6, message = "Mat khau phai co it nhat 6 ky tu.")
        String password
) {}
