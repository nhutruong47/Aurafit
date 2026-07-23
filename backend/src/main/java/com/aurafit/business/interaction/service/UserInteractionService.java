package com.aurafit.business.interaction.service;

import com.aurafit.business.interaction.dto.request.TrackInteractionRequest;

public interface UserInteractionService {

    void track(TrackInteractionRequest request, String authenticatedEmail);

    int attachSessionToUser(String sessionId, String authenticatedEmail);
}
