package com.aurafit.dto.response;

import java.util.List;

public record AiStylistSessionDTO(
        Long id,
        Long userId,
        String guestSessionId,
        CostumeDTO contextCostume,
        List<AiStylistMessageDTO> messages,
        String createdAt,
        String updatedAt
) {
}
