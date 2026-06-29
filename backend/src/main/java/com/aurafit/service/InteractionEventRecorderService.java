package com.aurafit.service;

import com.aurafit.entity.User;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;

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
