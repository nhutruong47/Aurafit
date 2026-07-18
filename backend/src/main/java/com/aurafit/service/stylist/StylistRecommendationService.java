package com.aurafit.service.stylist;

import com.aurafit.dto.response.ChatMessageResponse;

public interface StylistRecommendationService {

    ChatMessageResponse handleUserMessage(String sessionId, Long userId, String userMessage);
}
