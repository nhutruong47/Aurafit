package com.aurafit.interaction.service;

import com.aurafit.interaction.dto.request.TrackInteractionRequest;

public interface UserInteractionService {

    void track(TrackInteractionRequest request, String authenticatedEmail);

    int attachSessionToUser(String sessionId, String authenticatedEmail);
}
