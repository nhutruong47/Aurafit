package com.aurafit.business.user.dto.response;

import com.aurafit.business.user.entity.User;
import com.aurafit.business.user.enums.Role;
import com.aurafit.business.user.enums.UserStatus;

public record StaffAccountResponseDTO(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role,
        UserStatus status
) {
    public static StaffAccountResponseDTO fromEntity(User user) {
        return new StaffAccountResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus()
        );
    }
}
