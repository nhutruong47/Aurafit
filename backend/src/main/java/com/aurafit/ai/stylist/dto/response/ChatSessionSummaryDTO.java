package com.aurafit.ai.stylist.dto.response;

import java.time.LocalDateTime;

public record ChatSessionSummaryDTO(
        String sessionId,
        String previewText,
        LocalDateTime lastMessageAt,
        int messageCount
) {
}
