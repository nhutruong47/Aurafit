package com.aurafit.business.user.dto.response;

import com.aurafit.business.user.enums.Role;
import com.aurafit.business.user.enums.UserStatus;

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
        UserStatus status,
        String bankName,
        String bankAccountNumber,
        String bankAccountName
) {
}
