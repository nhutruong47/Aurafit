package com.aurafit.ai.stylist.service;

import com.aurafit.ai.stylist.dto.response.ChatMessageResponse;

public interface StylistRecommendationService {

    ChatMessageResponse handleUserMessage(String sessionId, Long userId, String userMessage);
}
