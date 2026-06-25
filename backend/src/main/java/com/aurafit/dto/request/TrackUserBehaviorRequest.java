package com.aurafit.dto.request;

import java.util.List;

public record TrackUserBehaviorRequest(
        String eventType,
        String actionType,
        String targetType,
        Long targetId,
        Long costumeId,
        Long orderId,
        String sessionId,
        String queryText,
        Object filterPayload,
        Object metadata,
        String sourcePage,
        String sourceModule,
        List<String> styleTags,
        List<String> occasionTags,
        List<String> colorTags,
        List<String> sizeTags,
        List<String> genderTags,
        String budgetTier
) {}
