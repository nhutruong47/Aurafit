package com.aurafit.service;

import java.util.List;

public interface AiProviderClient {

    String understandIntent(IntentUnderstandingPrompt prompt);

    List<String> generateRecommendationExplanations(RecommendationExplanationPrompt prompt);

    record IntentUnderstandingPrompt(
            AiChatContext chatContext
    ) {
    }

    record RecommendationExplanationPrompt(
            String surface,
            String contextSummary,
            String replyLanguage,
            String userMessageExcerpt,
            String detectedIntentJson,
            List<RecommendationExplanationItem> items,
            AiChatContext chatContext
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
