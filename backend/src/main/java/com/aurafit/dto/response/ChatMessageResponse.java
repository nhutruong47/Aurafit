package com.aurafit.dto.response;

import java.util.List;

public record ChatMessageResponse(
        String sessionId,
        String replyText,
        List<CatalogCostumeDTO> recommendedCostumes,
        boolean hasError,
        String errorType
) {
    public ChatMessageResponse(
            String sessionId,
            String replyText,
            List<CatalogCostumeDTO> recommendedCostumes
    ) {
        this(sessionId, replyText, recommendedCostumes, false, null);
    }

    public static ChatMessageResponse error(
            String sessionId,
            String replyText,
            String errorType
    ) {
        return new ChatMessageResponse(sessionId, replyText, List.of(), true, errorType);
    }
}
