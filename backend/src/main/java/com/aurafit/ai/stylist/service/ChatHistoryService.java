package com.aurafit.ai.stylist.service;

import com.aurafit.ai.stylist.dto.response.ChatSessionDetailDTO;
import com.aurafit.ai.stylist.dto.response.ChatSessionSummaryDTO;

import java.util.List;

public interface ChatHistoryService {

    List<ChatSessionSummaryDTO> getSessionsForUser(Long userId);

    ChatSessionDetailDTO getSessionDetail(String sessionId, Long userId);
}
