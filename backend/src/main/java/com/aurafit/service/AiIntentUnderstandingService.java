package com.aurafit.service;

import java.math.BigDecimal;

public interface AiIntentUnderstandingService {

    default IntentUnderstandingResult understandIntent(String latestUserMessage) {
        return understandIntent(AiChatContext.empty(latestUserMessage));
    }

    IntentUnderstandingResult understandIntent(AiChatContext context);

    record IntentUnderstandingResult(
            IntentType intent,
            double confidence,
            Language language,
            String occasion,
            String style,
            String color,
            String gender,
            String size,
            BigDecimal budget,
            String rentalDate,
            String productMentioned,
            boolean isFollowUp,
            boolean refersToPreviousRecommendations,
            String intentJson,
            boolean fallbackUsed
    ) {
        public boolean isRecommendationRequest() {
            return intent == IntentType.RECOMMENDATION_REQUEST;
        }

        public boolean isRecommendationFollowUp() {
            return intent == IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP || isFollowUp;
        }
    }

    enum IntentType {
        CASUAL_CHAT,
        RECOMMENDATION_REQUEST,
        RECOMMENDATION_EXPLANATION_FOLLOW_UP,
        PRODUCT_QUESTION,
        RENTAL_SUPPORT,
        OUT_OF_SCOPE
    }

    enum Language {
        VI("vi"),
        EN("en");

        private final String providerCode;

        Language(String providerCode) {
            this.providerCode = providerCode;
        }

        public String providerCode() {
            return providerCode;
        }

        public boolean isVietnamese() {
            return this == VI;
        }
    }
}
