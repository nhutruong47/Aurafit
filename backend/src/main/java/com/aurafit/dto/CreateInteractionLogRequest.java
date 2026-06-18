package com.aurafit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateInteractionLogRequest(
        @NotNull Long userId,
        @NotBlank String actionType,
        @NotBlank String targetType,
        @NotNull Long targetId,
        String searchQuery,
        String metadata
) {
}
