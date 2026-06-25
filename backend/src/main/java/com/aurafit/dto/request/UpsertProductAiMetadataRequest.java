package com.aurafit.dto.request;

import java.util.List;

public record UpsertProductAiMetadataRequest(
        List<String> styleTags,
        List<String> occasionTags,
        List<String> trendTags,
        List<String> sizeTags,
        List<String> colorTags,
        List<String> seasonTags,
        List<String> genderTags,
        List<String> materialTags,
        List<String> fitTags,
        String budgetTier,
        String silhouette,
        String formalityLevel,
        String adminNotes
) {}
