package com.aurafit.service;

import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AiChatContext(
        String latestUserMessage,
        String previousUserMessage,
        String previousAssistantSummary,
        String lastDetectedIntent,
        String lastUserNeedSummary,
        List<String> lastRecommendedProductNames,
        List<RecommendedProductContext> lastRecommendedProducts,
        List<RecentChatMessageContext> recentMessages,
        String userInteractionSummary,
        String rentalPeriodSummary,
        String availableProductSummary,
        String conversationSummary,
        boolean hasPreviousRecommendation,
        boolean likelyFollowUp,
        LocalDate lastRecommendationRentalStartDate,
        LocalDate lastRecommendationRentalEndDate
) {
    public AiChatContext {
        lastRecommendedProductNames = lastRecommendedProductNames == null ? List.of() : List.copyOf(lastRecommendedProductNames);
        lastRecommendedProducts = lastRecommendedProducts == null ? List.of() : List.copyOf(lastRecommendedProducts);
        recentMessages = recentMessages == null ? List.of() : List.copyOf(recentMessages);
        hasPreviousRecommendation = !lastRecommendedProducts.isEmpty();
    }

    public static AiChatContext empty(String latestUserMessage) {
        return new AiChatContext(
                latestUserMessage,
                null,
                null,
                null,
                null,
                List.of(),
                List.of(),
                List.of(),
                null,
                null,
                null,
                null,
                false,
                false,
                null,
                null
        );
    }

    public List<SimilarCostumeRecommendationDTO> lastRecommendationDtos() {
        return lastRecommendedProducts.stream()
                .map(RecommendedProductContext::recommendation)
                .filter(recommendation -> recommendation != null)
                .toList();
    }

    public record RecentChatMessageContext(String role, String content) {
    }

    public record RecommendedProductContext(
            Long productId,
            String productName,
            BigDecimal price,
            String reason,
            Integer score,
            String category,
            String style,
            String occasion,
            String season,
            String color,
            List<String> tags,
            Integer availableItemCount,
            LocalDate rentalStartDate,
            LocalDate rentalEndDate,
            SimilarCostumeRecommendationDTO recommendation
    ) {
        public RecommendedProductContext {
            tags = tags == null ? List.of() : List.copyOf(tags);
        }
    }
}
