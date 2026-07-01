package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.entity.AiStylistMessage;
import com.aurafit.entity.AiStylistSession;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.enums.AiStylistMessageRole;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.service.AiChatContext;
import com.aurafit.service.AiIntentUnderstandingService;
import com.aurafit.service.AiProviderClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class AiChatContextBuilderImplTest {

    private AiChatContextBuilderImpl builder;

    @BeforeEach
    void setUp() {
        builder = new AiChatContextBuilderImpl(new ObjectMapper());
    }

    @Test
    void build_ShouldExtractRecentMessagesAndPreviousRecommendations() {
        Costume blackVest = costume(20L, "Vest den cong so", "Formal", "Wedding", "Black");
        Costume grayVest = costume(21L, "Vest xam doanh nhan", "Formal", "Wedding", "Gray");
        Costume midiDress = costume(22L, "Dam midi den toi gian", "Elegant", "Wedding", "Black");
        AiStylistSession session = AiStylistSession.builder()
                .messages(new ArrayList<>(List.of(
                        message(AiStylistMessageRole.USER, "toi muon mac that lich su de du tiec cuoi", null),
                        message(
                                AiStylistMessageRole.ASSISTANT,
                                "Minh da goi y 3 mau phu hop.",
                                """
                                {
                                  "detectedIntent":"RECOMMENDATION_REQUEST",
                                  "lastUserNeedSummary":"occasion=wedding, style=formal",
                                  "recommendations":[
                                    {"costumeId":20,"reason":"Lich su va trang trong","score":95,"availableItemCount":1},
                                    {"costumeId":21,"reason":"Formal nhung nhe hon den","score":90,"availableItemCount":1},
                                    {"costumeId":22,"reason":"Thanh lich cho tiec toi","score":88,"availableItemCount":1}
                                  ]
                                }
                                """
                        )
                )))
                .build();

        AiChatContext context = builder.build(
                session,
                "vi sao nhung cai nay phu hop?",
                Map.of(
                        20L, blackVest,
                        21L, grayVest,
                        22L, midiDress
                )
        );

        assertTrue(context.hasPreviousRecommendation());
        assertTrue(context.likelyFollowUp());
        assertEquals(3, context.lastRecommendedProducts().size());
        assertEquals(List.of("Vest den cong so", "Vest xam doanh nhan", "Dam midi den toi gian"), context.lastRecommendedProductNames());
        assertEquals(2, context.recentMessages().size());
        assertTrue(context.conversationSummary().contains("Assistant recommended"));
    }

    @Test
    void build_ShouldBeEmptyAndSafeForEmptySession() {
        AiChatContext context = builder.build(
                AiStylistSession.builder().messages(new ArrayList<>()).build(),
                "hello",
                Map.of()
        );

        assertFalse(context.hasPreviousRecommendation());
        assertFalse(context.recentMessages().size() > 0);
        assertEquals("hello", context.latestUserMessage());
    }

    @Test
    void build_ShouldIgnoreInvalidMetadataJsonWithoutCrashing() {
        AiStylistSession session = AiStylistSession.builder()
                .messages(new ArrayList<>(List.of(
                        message(AiStylistMessageRole.ASSISTANT, "Broken metadata", "{not-json}")
                )))
                .build();

        AiChatContext context = builder.build(session, "giai thich them di", Map.of());

        assertNotNull(context);
        assertFalse(context.hasPreviousRecommendation());
        assertTrue(context.likelyFollowUp());
    }

    @Test
    void build_ShouldProvideContextThatKeepsFollowUpOutOfOutOfScope() {
        Costume blackVest = costume(20L, "Vest den cong so", "Formal", "Wedding", "Black");
        AiStylistSession session = AiStylistSession.builder()
                .messages(new ArrayList<>(List.of(
                        message(AiStylistMessageRole.USER, "toi muon mac that lich su de du tiec cuoi", null),
                        message(
                                AiStylistMessageRole.ASSISTANT,
                                "Minh da goi y 1 mau phu hop.",
                                """
                                {
                                  "detectedIntent":"RECOMMENDATION_REQUEST",
                                  "lastUserNeedSummary":"occasion=wedding, style=formal",
                                  "recommendations":[
                                    {"costumeId":20,"reason":"Lich su va trang trong","score":95,"availableItemCount":1}
                                  ]
                                }
                                """
                        )
                )))
                .build();

        AiChatContext context = builder.build(session, "vi sao nhung cai nay phu hop?", Map.of(20L, blackVest));

        AiProviderProperties properties = new AiProviderProperties();
        properties.setEnabled(false);
        properties.setProviderBaseUrl("https://provider.example");
        properties.setProviderApiKey("secret");
        properties.setChatModel("gemini-test");
        AiIntentUnderstandingServiceImpl intentService = new AiIntentUnderstandingServiceImpl(
                properties,
                mock(AiProviderClient.class),
                new ObjectMapper()
        );

        AiIntentUnderstandingService.IntentUnderstandingResult result = intentService.understandIntent(context);

        assertEquals(AiIntentUnderstandingService.IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP, result.intent());
        assertTrue(result.isFollowUp());
    }

    private AiStylistMessage message(AiStylistMessageRole role, String content, String metadataJson) {
        return AiStylistMessage.builder()
                .role(role)
                .content(content)
                .metadataJson(metadataJson)
                .build();
    }

    private Costume costume(Long id, String name, String style, String occasion, String color) {
        Category category = Category.builder().id(1L).name("Formal").build();
        Costume costume = Costume.builder()
                .id(id)
                .name(name)
                .description(name + " description")
                .rentalPrice(BigDecimal.valueOf(250_000))
                .depositPrice(BigDecimal.valueOf(400_000))
                .imageUrl("https://example.com/" + id + ".jpg")
                .status(CostumeStatus.ACTIVE)
                .category(category)
                .items(new ArrayList<>())
                .build();
        CostumeMetadata metadata = CostumeMetadata.builder()
                .style(style)
                .occasion(occasion)
                .season("All Season")
                .color(color)
                .tags(new ArrayList<>(List.of("formal")))
                .costume(costume)
                .build();
        costume.setMetadata(metadata);
        costume.setItems(List.of(
                CostumeItem.builder()
                        .id(id * 10 + 1)
                        .sku("SKU-" + id)
                        .size("M")
                        .color(color)
                        .status(ItemStatus.AVAILABLE)
                        .costume(costume)
                        .build()
        ));
        return costume;
    }
}
