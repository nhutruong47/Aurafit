package com.aurafit.service.impl;

import com.aurafit.dto.request.TrackInteractionRequest;
import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.UserInteractionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserInteractionServiceImpl implements UserInteractionService {

    private final UserInteractionEventRepository userInteractionEventRepository;
    private final UserRepository userRepository;

    public UserInteractionServiceImpl(UserInteractionEventRepository userInteractionEventRepository,
                                      UserRepository userRepository) {
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void track(TrackInteractionRequest request, String authenticatedEmail) {
        UserInteractionEvent event = UserInteractionEvent.builder()
                .user(resolveAuthenticatedUser(authenticatedEmail))
                .sessionId(request.sessionId().trim())
                .eventType(request.eventType())
                .targetType(request.targetType())
                .targetId(normalizeNullable(request.targetId()))
                .queryText(normalizeNullable(request.queryText()))
                .pagePath(normalizeNullable(request.pagePath()))
                .metadataJson(normalizeNullable(request.metadataJson()))
                .build();

        userInteractionEventRepository.save(event);
    }

    @Override
    public int attachSessionToUser(String sessionId, String authenticatedEmail) {
        User user = resolveAuthenticatedUser(authenticatedEmail);
        if (user == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return userInteractionEventRepository.attachSessionToUser(sessionId.trim(), user);
    }

    private User resolveAuthenticatedUser(String authenticatedEmail) {
        if (authenticatedEmail == null || authenticatedEmail.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authenticatedEmail));
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

}
