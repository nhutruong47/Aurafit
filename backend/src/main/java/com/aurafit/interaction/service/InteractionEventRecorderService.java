package com.aurafit.interaction.service;

import com.aurafit.business.user.entity.User;
import com.aurafit.interaction.enums.InteractionEventType;
import com.aurafit.interaction.enums.InteractionTargetType;

import java.util.Map;

public interface InteractionEventRecorderService {

    void record(User user,
                String sessionId,
                InteractionEventType eventType,
                InteractionTargetType targetType,
                String targetId,
                String pagePath,
                String queryText,
                Map<String, Object> metadata);
}
