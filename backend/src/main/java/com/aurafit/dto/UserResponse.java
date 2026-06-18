package com.aurafit.dto;

import com.aurafit.entity.User;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        String role
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole()
        );
    }
}
