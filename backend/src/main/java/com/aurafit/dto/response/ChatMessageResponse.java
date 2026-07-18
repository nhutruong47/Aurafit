package com.aurafit.dto.response;

import java.util.List;

public record ChatMessageResponse(
        String sessionId,
        String replyText,
        List<CatalogCostumeDTO> recommendedCostumes
) {
}
