package com.aurafit.ai.stylist.dto.response;

import java.util.List;

public record ChatSessionDetailDTO(
        String sessionId,
        List<ChatMessageDTO> messages
) {
}
