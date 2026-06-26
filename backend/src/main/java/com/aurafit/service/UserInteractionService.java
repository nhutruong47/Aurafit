package com.aurafit.service;

import com.aurafit.dto.request.TrackInteractionRequest;

public interface UserInteractionService {

    void track(TrackInteractionRequest request, String authenticatedEmail);

    int attachSessionToUser(String sessionId, String authenticatedEmail);
}
