package com.aurafit.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Vui lòng nhập họ tên.")
    private String fullName;

    @NotBlank(message = "Vui lòng cung cấp địa chỉ email.")
    @Email(message = "Địa chỉ email không đúng định dạng.")
    private String email;

    @NotBlank(message = "Vui lòng cung cấp số điện thoại.")
    private String phone;

    @NotBlank(message = "Vui lòng nhập mật khẩu.")
    private String password;
}
