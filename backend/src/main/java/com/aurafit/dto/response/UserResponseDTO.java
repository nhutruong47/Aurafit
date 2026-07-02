package com.aurafit.dto.response;

import com.aurafit.enums.Role;
import com.aurafit.enums.UserStatus;

/**
 * Safe projection of the User entity for API responses.
 * Deliberately excludes passwordHash, emailVerified, phoneVerified.
 */
public record UserResponseDTO(
        Long id,
        String fullName,
        String email,
        String phone,
        String address,
        Role role,
        UserStatus status
) {
}
