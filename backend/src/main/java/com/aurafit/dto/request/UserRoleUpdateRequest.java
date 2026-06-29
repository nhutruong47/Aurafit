package com.aurafit.dto.request;

import com.aurafit.enums.Role;
import jakarta.validation.constraints.NotNull;

public record UserRoleUpdateRequest(
        @NotNull(message = "Role is required.")
        Role role
) {
}
