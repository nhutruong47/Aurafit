package com.aurafit.business.auth.dto.response;

import com.aurafit.business.user.dto.response.UserResponseDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Authentication response containing the access token in the body
 * and user profile. The refreshToken is transported via HttpOnly cookie
 * and is excluded from JSON serialization for defense-in-depth.
 */
public record AuthResponseDTO(
        String accessToken,
        @JsonIgnore String refreshToken,
        UserResponseDTO user
) {
}
