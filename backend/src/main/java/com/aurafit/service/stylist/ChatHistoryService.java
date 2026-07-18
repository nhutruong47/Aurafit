package com.aurafit.service.stylist;

import com.aurafit.dto.response.ChatSessionDetailDTO;
import com.aurafit.dto.response.ChatSessionSummaryDTO;

import java.util.List;

public interface ChatHistoryService {

    List<ChatSessionSummaryDTO> getSessionsForUser(Long userId);

    ChatSessionDetailDTO getSessionDetail(String sessionId, Long userId);
}
