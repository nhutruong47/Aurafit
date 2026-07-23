package com.aurafit.business.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Step 1 DTO — Client submits full registration details (email, name, phone,
 * password) together so the server can persist the data alongside the OTP
 * entry. Step 2 (verify-otp) only needs to confirm the OTP code.
 */
public record OtpRequestDTO(
        @NotBlank(message = "Vui lòng cung cấp địa chỉ email.")
        @Email(message = "Địa chỉ email không đúng định dạng.")
        String email,

        @NotBlank(message = "Vui lòng nhập họ tên.")
        String fullName,

        @NotBlank(message = "Vui lòng cung cấp số điện thoại.")
        @Pattern(regexp = "0\\d{9}", message = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.")
        String phone,

        @NotBlank(message = "Vui lòng nhập mật khẩu.")
        @Size(min = 6, message = "Mật khẩu phải chứa ít nhất 6 ký tự.")
        String password
) {}
