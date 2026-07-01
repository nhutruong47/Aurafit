package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.service.AiChatContext;
import com.aurafit.service.AiIntentUnderstandingService;
import com.aurafit.service.AiProviderClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiIntentUnderstandingServiceImplTest {

    @Mock
    private AiProviderClient aiProviderClient;

    private AiProviderProperties properties;
    private AiIntentUnderstandingServiceImpl service;

    @BeforeEach
    void setUp() {
        properties = new AiProviderProperties();
        properties.setEnabled(false);
        properties.setProviderBaseUrl("https://provider.example");
        properties.setProviderApiKey("secret");
        properties.setChatModel("gemini-test");
        service = new AiIntentUnderstandingServiceImpl(properties, aiProviderClient, new ObjectMapper());
    }

    @Test
    void understandIntent_ShouldDetectVietnameseCasualChat() {
        AiIntentUnderstandingService.IntentUnderstandingResult result = service.understandIntent("ban khoe khong");

        assertEquals(AiIntentUnderstandingService.IntentType.CASUAL_CHAT, result.intent());
        assertEquals(AiIntentUnderstandingService.Language.VI, result.language());
        assertTrue(result.fallbackUsed());
    }

    @Test
    void understandIntent_ShouldDetectEnglishCasualChat() {
        AiIntentUnderstandingService.IntentUnderstandingResult result = service.understandIntent("Hello");

        assertEquals(AiIntentUnderstandingService.IntentType.CASUAL_CHAT, result.intent());
        assertEquals(AiIntentUnderstandingService.Language.EN, result.language());
    }

    @Test
    void understandIntent_ShouldDetectWeddingRecommendationRequest() {
        AiIntentUnderstandingService.IntentUnderstandingResult result =
                service.understandIntent("toi muon lich su de du tiec cuoi");

        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_REQUEST, result.intent());
        assertEquals("wedding", result.occasion());
        assertEquals("formal", result.style());
    }

    @Test
    void understandIntent_ShouldDetectEnglishPromRecommendationRequest() {
        AiIntentUnderstandingService.IntentUnderstandingResult result =
                service.understandIntent("Need an elegant outfit for prom");

        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_REQUEST, result.intent());
        assertEquals(AiIntentUnderstandingService.Language.EN, result.language());
        assertEquals("prom", result.occasion());
        assertEquals("formal", result.style());
    }

    @Test
    void understandIntent_ShouldDetectRentalSupport() {
        AiIntentUnderstandingService.IntentUnderstandingResult result =
                service.understandIntent("thue do can dat coc khong?");

        assertEquals(AiIntentUnderstandingService.IntentType.RENTAL_SUPPORT, result.intent());
    }

    @Test
    void understandIntent_ShouldDetectProductQuestion() {
        AiIntentUnderstandingService.IntentUnderstandingResult result =
                service.understandIntent("bo nay con size M khong?");

        assertEquals(AiIntentUnderstandingService.IntentType.PRODUCT_QUESTION, result.intent());
        assertEquals("M", result.size());
        assertEquals("current_product", result.productMentioned());
    }

    @Test
    void understandIntent_ShouldDetectOutOfScope() {
        AiIntentUnderstandingService.IntentUnderstandingResult result = service.understandIntent("asdfghjkl");

        assertEquals(AiIntentUnderstandingService.IntentType.OUT_OF_SCOPE, result.intent());
    }

    @Test
    void understandIntent_ShouldDetectRecommendationExplanationFollowUpFromConversationContext() {
        AiIntentUnderstandingService.IntentUnderstandingResult result = service.understandIntent(
                buildChatContext(
                        "vi sao nhung cai nay lai phu hop voi nhu cau cua toi",
                        "toi muon mac that lich su de du tiec cuoi",
                        "Minh da goi y 3 mau phu hop.",
                        "RECOMMENDATION_REQUEST",
                        "occasion=wedding, style=formal",
                        List.of("Vest Ä‘en cÃ´ng sá»Ÿ", "Vest xÃ¡m doanh nhÃ¢n", "Äáº§m midi Ä‘en tá»‘i giáº£n"),
                        true
                )
        );

        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP, result.intent());
        assertTrue(result.isFollowUp());
        assertTrue(result.refersToPreviousRecommendations());
        assertEquals(AiIntentUnderstandingService.Language.VI, result.language());
    }

    @Test
    void understandIntent_ShouldDetectEnglishRecommendationExplanationFollowUp() {
        AiIntentUnderstandingService.IntentUnderstandingResult result = service.understandIntent(
                buildChatContext(
                        "why did you recommend these?",
                        "Need an elegant outfit for prom",
                        "These are the strongest matches.",
                        "RECOMMENDATION_REQUEST",
                        "occasion=prom, style=formal",
                        List.of("Silver Prom Gown", "Black Evening Dress"),
                        true
                )
        );

        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP, result.intent());
        assertTrue(result.isFollowUp());
        assertTrue(result.refersToPreviousRecommendations());
        assertEquals(AiIntentUnderstandingService.Language.EN, result.language());
    }

    @Test
    void understandIntent_ShouldPreferFollowUpOverOutOfScopeWhenRecommendationContextIsMissing() {
        AiIntentUnderstandingService.IntentUnderstandingResult result = service.understandIntent(
                buildChatContext(
                        "giai thich them di",
                        null,
                        null,
                        null,
                        null,
                        List.of(),
                        true
                )
        );

        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP, result.intent());
        assertTrue(result.isFollowUp());
        assertFalse(result.refersToPreviousRecommendations());
    }

    @Test
    void understandIntent_ShouldUseProviderWhenJsonIsValid() {
        properties.setEnabled(true);
        when(aiProviderClient.understandIntent(any())).thenReturn("""
                {
                  "intent":"RECOMMENDATION_REQUEST",
                  "isFollowUp":false,
                  "refersToPreviousRecommendations":false,
                  "confidence":0.97,
                  "language":"vi",
                  "occasion":"wedding",
                  "style":"formal",
                  "color":"black",
                  "gender":null,
                  "size":null,
                  "budget":300000,
                  "rentalDate":"next_week",
                  "productMentioned":null
                }
                """);

        AiIntentUnderstandingService.IntentUnderstandingResult result =
                service.understandIntent("toi muon do mau den di dam cuoi tuan sau duoi 300k");

        assertFalse(result.fallbackUsed());
        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_REQUEST, result.intent());
        assertEquals("wedding", result.occasion());
        assertEquals("formal", result.style());
        assertEquals("black", result.color());
        assertEquals(new BigDecimal("300000"), result.budget());
        assertEquals("next_week", result.rentalDate());
    }

    @Test
    void understandIntent_ShouldUseProviderWhenFollowUpJsonIsValid() {
        properties.setEnabled(true);
        when(aiProviderClient.understandIntent(any())).thenReturn("""
                {
                  "intent":"RECOMMENDATION_EXPLANATION_FOLLOW_UP",
                  "isFollowUp":true,
                  "refersToPreviousRecommendations":true,
                  "confidence":0.95,
                  "language":"en",
                  "occasion":null,
                  "style":null,
                  "color":null,
                  "gender":null,
                  "size":null,
                  "budget":null,
                  "rentalDate":null,
                  "productMentioned":null
                }
                """);

        AiIntentUnderstandingService.IntentUnderstandingResult result = service.understandIntent(
                buildChatContext(
                        "why did you recommend these?",
                        "Need an elegant outfit for prom",
                        "These were the strongest matches.",
                        "RECOMMENDATION_REQUEST",
                        "occasion=prom, style=formal",
                        List.of("Silver Prom Gown"),
                        true
                )
        );

        assertFalse(result.fallbackUsed());
        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP, result.intent());
        assertTrue(result.isFollowUp());
        assertTrue(result.refersToPreviousRecommendations());
        assertEquals(AiIntentUnderstandingService.Language.EN, result.language());
    }

    @Test
    void understandIntent_ShouldFallbackWhenProviderReturnsInvalidJson() {
        properties.setEnabled(true);
        when(aiProviderClient.understandIntent(any())).thenReturn("{\"intent\":\"UNKNOWN\"}");

        AiIntentUnderstandingService.IntentUnderstandingResult result =
                service.understandIntent("Need an elegant outfit for prom");

        assertTrue(result.fallbackUsed());
        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_REQUEST, result.intent());
        assertEquals("prom", result.occasion());
    }

    @Test
    void understandIntent_ShouldFallbackWhenProviderTimesOut() {
        properties.setEnabled(true);
        when(aiProviderClient.understandIntent(any())).thenThrow(new IllegalStateException("AI provider request timed out."));

        AiIntentUnderstandingService.IntentUnderstandingResult result =
                service.understandIntent("thue do can dat coc khong?");

        assertTrue(result.fallbackUsed());
        assertEquals(AiIntentUnderstandingService.IntentType.RENTAL_SUPPORT, result.intent());
    }

    @Test
    void understandIntent_ShouldFallbackWhenProviderIsUnavailable() {
        properties.setEnabled(true);
        when(aiProviderClient.understandIntent(any())).thenThrow(new IllegalStateException("AI provider returned HTTP 429."));

        AiIntentUnderstandingService.IntentUnderstandingResult result =
                service.understandIntent("Hello");

        assertTrue(result.fallbackUsed());
        assertEquals(AiIntentUnderstandingService.IntentType.CASUAL_CHAT, result.intent());
        assertEquals(AiIntentUnderstandingService.Language.EN, result.language());
    }

    private AiChatContext buildChatContext(String latestUserMessage,
                                           String previousUserMessage,
                                           String previousAssistantSummary,
                                           String lastDetectedIntent,
                                           String lastUserNeedSummary,
                                           List<String> lastRecommendedProductNames,
                                           boolean likelyFollowUp) {
        List<AiChatContext.RecommendedProductContext> lastRecommendedProducts = lastRecommendedProductNames.stream()
                .map(name -> new AiChatContext.RecommendedProductContext(
                        null,
                        name,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        List.of(),
                        null,
                        null,
                        null,
                        null
                ))
                .toList();
        return new AiChatContext(
                latestUserMessage,
                previousUserMessage,
                previousAssistantSummary,
                lastDetectedIntent,
                lastUserNeedSummary,
                lastRecommendedProductNames,
                lastRecommendedProducts,
                List.of(),
                null,
                null,
                null,
                null,
                !lastRecommendedProducts.isEmpty(),
                likelyFollowUp,
                null,
                null
        );
    }
}
