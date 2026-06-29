package com.aurafit.service;

import java.util.List;

public interface AiProviderClient {

    List<String> generateRecommendationExplanations(RecommendationExplanationPrompt prompt);

    record RecommendationExplanationPrompt(
            String surface,
            String contextSummary,
            List<RecommendationExplanationItem> items
    ) {
    }

    record RecommendationExplanationItem(
            Long costumeId,
            String costumeName,
            String categoryName,
            String description,
            String style,
            String occasion,
            String season,
            String color,
            List<String> tags,
            String originalReason,
            int availableItemCount
    ) {
    }
}
