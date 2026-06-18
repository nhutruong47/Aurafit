package com.aurafit.dto.request;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String phone;
    private String password;
}
