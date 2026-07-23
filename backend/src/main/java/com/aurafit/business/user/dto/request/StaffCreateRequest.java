package com.aurafit.business.user.dto.request;

import com.aurafit.business.user.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StaffCreateRequest(
        @NotBlank(message = "Họ tên không được để trống")
        String fullName,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        String email,

        @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
        String phone,

        UserStatus status,

        String temporaryPassword
) {
}
