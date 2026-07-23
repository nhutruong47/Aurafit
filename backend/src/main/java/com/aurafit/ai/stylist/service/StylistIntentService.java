package com.aurafit.ai.stylist.service;

import com.aurafit.ai.stylist.entity.ChatMessage;

import java.util.List;

public interface StylistIntentService {

    StylistFilterCriteria extractIntent(String userMessage, List<ChatMessage> recentHistory);
}
