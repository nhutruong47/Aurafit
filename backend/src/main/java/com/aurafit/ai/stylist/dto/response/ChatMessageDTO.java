package com.aurafit.ai.stylist.dto.response;

import com.aurafit.business.catalog.dto.response.CatalogCostumeDTO;
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
