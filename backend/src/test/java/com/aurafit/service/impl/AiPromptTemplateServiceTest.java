package com.aurafit.service.impl;

import com.aurafit.service.AiChatContext;
import com.aurafit.service.AiProviderClient;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiPromptTemplateServiceTest {

    @Test
    void composeRecommendationExplanationSystemPrompt_ShouldResolveTemplateSections() {
        AiPromptResourceService resourceService = new AiPromptResourceService();
        AiPromptTemplateService templateService = new AiPromptTemplateService(resourceService);

        String prompt = templateService.composeRecommendationExplanationSystemPrompt(
                new AiProviderClient.RecommendationExplanationPrompt(
                        "ai_stylist_chat",
                        "AI stylist recommendations grounded in the live catalog. Rental availability window: 2026-07-10 to 2026-07-12.",
                        "vi",
                        "Can goi y vay du tiec mau do khong",
                        "{\"intent\":\"RECOMMENDATION_REQUEST\",\"language\":\"vi\",\"occasion\":\"party\"}",
                        List.of(
                                new AiProviderClient.RecommendationExplanationItem(
                                        10L,
                                        "Red Gala Dress",
                                        "Events",
                                        "Elegant evening dress",
                                        "Elegant",
                                        "Gala",
                                        "Winter",
                                        "Red",
                                        List.of("formal"),
                                        "Phu hop voi dip tiec toi",
                                        2
                                )
                        ),
                        new AiChatContext(
                                "Can goi y vay du tiec mau do khong",
                                "Toi can do di tiec",
                                "Da tim thay vai lua chon phu hop.",
                                "RECOMMENDATION_REQUEST",
                                "occasion=party, color=red",
                                List.of("Red Gala Dress"),
                                List.of(
                                        new AiChatContext.RecommendedProductContext(
                                                10L,
                                                "Red Gala Dress",
                                                null,
                                                "Phu hop voi dip tiec toi",
                                                95,
                                                "Events",
                                                "Elegant",
                                                "Gala",
                                                "Winter",
                                                "Red",
                                                List.of("formal"),
                                                2,
                                                null,
                                                null,
                                                null
                                        )
                                ),
                                List.of(
                                        new AiChatContext.RecentChatMessageContext("user", "Toi can do di tiec"),
                                        new AiChatContext.RecentChatMessageContext("assistant", "Da tim thay vai lua chon phu hop.")
                                ),
                                null,
                                "2026-07-10 to 2026-07-12",
                                "Red Gala Dress",
                                "Previous user need: occasion=party, color=red. Assistant recommended: Red Gala Dress.",
                                true,
                                false,
                                null,
                                null
                        )
                )
        );

        assertTrue(prompt.contains("[System Identity]"));
        assertTrue(prompt.contains("AuraFit AI Stylist"));
        assertTrue(prompt.contains("[Intent Policy]"));
        assertTrue(prompt.contains("Red Gala Dress"));
        assertTrue(prompt.contains("2026-07-10 to 2026-07-12"));
        assertTrue(prompt.contains("[Conversation Context]"));
        assertTrue(prompt.contains("[Recent Messages]"));
        assertTrue(prompt.contains("[Last Recommendations]"));
        assertTrue(prompt.contains("[Latest User Message - Highest Priority]"));
        assertTrue(prompt.contains("[Detected Intent]"));
        assertTrue(prompt.contains("\"intent\":\"RECOMMENDATION_REQUEST\""));
        assertTrue(prompt.contains("[Response Mode Instruction]"));
        assertTrue(prompt.contains("[User Interaction History - Personalization Only]"));
        assertTrue(prompt.contains("[Current Task]"));
        assertFalse(prompt.contains("{{stylistSystem}}"));
    }

    @Test
    void composeIntentUnderstandingSystemPrompt_ShouldLoadJsonOnlyInstruction() {
        AiPromptResourceService resourceService = new AiPromptResourceService();
        AiPromptTemplateService templateService = new AiPromptTemplateService(resourceService);

        String prompt = templateService.composeIntentUnderstandingSystemPrompt();

        assertTrue(prompt.contains("Return exactly one JSON object"));
        assertTrue(prompt.contains("previousAssistantSummary"));
        assertTrue(prompt.contains("recentMessages"));
        assertTrue(prompt.contains("conversationSummary"));
        assertTrue(prompt.contains("RECOMMENDATION_EXPLANATION_FOLLOW_UP"));
        assertTrue(prompt.contains("RECOMMENDATION_REQUEST"));
        assertTrue(prompt.contains("\"language\":\"vi\""));
    }

    @Test
    void loadPromptContent_ShouldFallbackWhenResourceIsMissing() {
        AiPromptResourceService resourceService = new AiPromptResourceService();

        String content = resourceService.loadPromptContent("ai/missing-file.md", "fallback content");

        assertTrue(content.contains("fallback content"));
    }
}
