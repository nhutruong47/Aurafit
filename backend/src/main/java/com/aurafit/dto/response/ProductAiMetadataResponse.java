package com.aurafit.dto.response;

import com.aurafit.enums.AiEmbeddingStatus;

import java.util.List;

public record ProductAiMetadataResponse(
        Long costumeId,
        String costumeName,
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
        String adminNotes,
        String searchableText,
        AiEmbeddingStatus embeddingStatus,
        String embeddingModel
) {}
