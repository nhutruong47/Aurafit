package com.aurafit.business.user.dto.request;

import com.aurafit.business.user.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(
        @NotNull(message = "Trạng thái tài khoản là bắt buộc")
        UserStatus status
) {
}
