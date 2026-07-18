package com.aurafit.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record ChatMessageDTO(
        Long id,
        String role,
        String content,
        List<CatalogCostumeDTO> recommendedCostumes,
        LocalDateTime createdAt
) {
}
