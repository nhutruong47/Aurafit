package com.aurafit.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    @NotBlank(message = "Vui lòng cung cấp địa chỉ email.")
    @Email(message = "Địa chỉ email không đúng định dạng.")
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu.")
    private String password;
}
