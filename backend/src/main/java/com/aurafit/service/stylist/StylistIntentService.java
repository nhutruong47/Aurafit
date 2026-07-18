package com.aurafit.service.stylist;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.ChatMessage;

import java.util.List;

public interface StylistIntentService {

    StylistFilterCriteria extractIntent(String userMessage, List<ChatMessage> recentHistory);
}
