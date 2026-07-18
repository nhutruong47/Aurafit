package com.aurafit.dto.request;

import com.aurafit.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(
        @NotNull(message = "Trạng thái tài khoản là bắt buộc")
        UserStatus status
) {
}
