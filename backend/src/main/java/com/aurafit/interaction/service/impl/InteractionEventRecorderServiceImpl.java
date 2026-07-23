package com.aurafit.interaction.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.business.user.entity.User;
import com.aurafit.interaction.entity.UserInteractionEvent;
import com.aurafit.interaction.enums.InteractionEventType;
import com.aurafit.interaction.enums.InteractionTargetType;
import com.aurafit.interaction.repository.UserInteractionEventRepository;
import com.aurafit.interaction.service.InteractionEventRecorderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@Transactional
public class InteractionEventRecorderServiceImpl implements InteractionEventRecorderService {

    private final UserInteractionEventRepository userInteractionEventRepository;
    private final ObjectMapper objectMapper;

    public InteractionEventRecorderServiceImpl(UserInteractionEventRepository userInteractionEventRepository,
                                               ObjectMapper objectMapper) {
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void record(User user,
                       String sessionId,
                       InteractionEventType eventType,
                       InteractionTargetType targetType,
                       String targetId,
                       String pagePath,
                       String queryText,
                       Map<String, Object> metadata) {
        UserInteractionEvent event = UserInteractionEvent.builder()
                .user(user)
                .sessionId(normalizeSessionId(sessionId, user))
                .eventType(eventType)
                .targetType(targetType)
                .targetId(normalizeNullable(targetId))
                .pagePath(normalizeNullable(pagePath))
                .queryText(normalizeNullable(queryText))
                .metadataJson(writeMetadata(metadata))
                .build();

        userInteractionEventRepository.save(event);
    }

    private String normalizeSessionId(String sessionId, User user) {
        String normalized = normalizeNullable(sessionId);
        if (normalized != null) {
            return normalized;
        }

        Long userId = user != null ? user.getId() : null;
        return userId != null ? "authenticated-user-" + userId : "server-side";
    }

    private String writeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
