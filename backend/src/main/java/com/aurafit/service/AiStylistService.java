package com.aurafit.service;

import com.aurafit.dto.response.AiStylistSessionAttachResponse;
import com.aurafit.dto.request.CreateAiStylistSessionRequest;
import com.aurafit.dto.request.SendAiStylistMessageRequest;
import com.aurafit.dto.response.AiStylistSessionDTO;

public interface AiStylistService {

    AiStylistSessionDTO createSession(CreateAiStylistSessionRequest request, String authenticatedEmail);

    AiStylistSessionDTO getSession(Long sessionId, String guestSessionId, String authenticatedEmail);

    AiStylistSessionDTO sendMessage(SendAiStylistMessageRequest request, String authenticatedEmail);

    AiStylistSessionAttachResponse attachGuestSessionsToUser(String guestSessionId, Long preferredSessionId, String authenticatedEmail);
}
