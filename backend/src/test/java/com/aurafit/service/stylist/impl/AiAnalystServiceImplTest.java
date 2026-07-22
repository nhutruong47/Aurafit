package com.aurafit.service.stylist.impl;

import com.aurafit.dto.response.AiInsightResponse;
import com.aurafit.entity.AiInsight;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.enums.AiCallType;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.EventStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.repository.AiInsightRepository;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.EventRepository;
import com.aurafit.repository.InventoryRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiAnalystServiceImplTest {

    @Test
    @SuppressWarnings("unchecked")
    void aggregateInteractionCounts_shouldIgnoreLegacyDatabaseEventTypes() {
        UserInteractionEventRepository interactionRepository = mock(UserInteractionEventRepository.class);
        LocalDateTime periodStart = LocalDateTime.of(2026, 7, 14, 0, 0);
        LocalDateTime periodEnd = LocalDateTime.of(2026, 7, 21, 0, 0);
        when(interactionRepository.countByEventTypeForPeriod(periodStart, periodEnd))
                .thenReturn(List.<Object[]>of(
                        new Object[]{"VIEW_PRODUCT", 12L},
                        new Object[]{"SEARCH", 3L},
                        new Object[]{"AI_CHAT_ASSISTANT_MESSAGE", 2L},
                        new Object[]{"RECOMMENDATION_IMPRESSION", 8L}
                ));
        AiAnalystServiceImpl service = new AiAnalystServiceImpl(
                mock(ChatMessageRepository.class),
                interactionRepository,
                mock(AiInsightRepository.class),
                mock(CategoryRepository.class),
                mock(CostumeRepository.class),
                mock(InventoryRepository.class),
                mock(EventRepository.class),
                mock(GeminiClient.class),
                new ObjectMapper().findAndRegisterModules(),
                3
        );

        Map<InteractionEventType, Long> counts = ReflectionTestUtils.invokeMethod(
                service,
                "aggregateInteractionCounts",
                periodStart,
                periodEnd
        );

        assertEquals(InteractionEventType.values().length, counts.size());
        assertEquals(12L, counts.get(InteractionEventType.VIEW_PRODUCT));
        assertEquals(3L, counts.get(InteractionEventType.SEARCH));
        assertEquals(0L, counts.get(InteractionEventType.ADD_TO_CART));
    }

    @Test
    void generateWeeklyInsight_shouldParseValidSuggestedEventsAndUseOnlyOneGeminiCall() {
        AnalystFixture fixture = fixture();
        Category category = Category.builder()
                .id(7L)
                .name("Đầm dạ hội")
                .slug("dam-da-hoi")
                .path("su-kien/da-hoi/dam-da-hoi")
                .isActive(true)
                .build();
        Costume costume = Costume.builder()
                .id(12L)
                .name("Đầm Ruby")
                .category(category)
                .status(CostumeStatus.ACTIVE)
                .build();
        when(fixture.interactionRepository().findEventTypeAndMetadataForPeriod(any(), any(), any()))
                .thenReturn(List.<Object[]>of(
                        new Object[]{InteractionEventType.SEARCH, "{\"category\":\"Đầm dạ hội\"}"}
                ));
        when(fixture.categoryRepository().findActiveByDemandIdentifiers(List.of("đầm dạ hội")))
                .thenReturn(List.of(category));
        when(fixture.eventRepository().existsActiveEventForCategory(
                eq(7L),
                eq("su-kien/da-hoi/dam-da-hoi"),
                eq(EventStatus.ACTIVE),
                any(LocalDateTime.class)
        )).thenReturn(false);
        when(fixture.costumeRepository().findAllActiveByDemandCategoryIds(
                List.of(7L),
                CostumeStatus.ACTIVE
        )).thenReturn(List.of(costume));
        when(fixture.inventoryRepository().getPooledItemCountsByCostumeIds(List.of(12L)))
                .thenReturn(List.<Object[]>of(new Object[]{12L, 2L}));
        when(fixture.geminiClient().generateText(eq(AiCallType.INSIGHT), any(), any()))
                .thenReturn("""
                        Nhu cầu đầm dạ hội đang tăng, nên chuẩn bị ưu đãi phù hợp.
                        SUGGESTED_EVENTS_JSON: [{"name":"Gala Ruby","reason":"Nhu cầu cao, tồn kho thấp","categorySlug":"dam-da-hoi","suggestedDiscountPercent":15,"costumeIds":[12]}]
                        """);

        AiInsightResponse response = fixture.service().generateWeeklyInsight();

        assertEquals("Nhu cầu đầm dạ hội đang tăng, nên chuẩn bị ưu đãi phù hợp.", response.content());
        assertEquals(1, response.suggestedEvents().size());
        assertEquals("Gala Ruby", response.suggestedEvents().get(0).name());
        assertEquals(new BigDecimal("15"), response.suggestedEvents().get(0).suggestedDiscountPercent());
        assertEquals(List.of(12L), response.suggestedEvents().get(0).costumeIds());

        ArgumentCaptor<AiInsight> insightCaptor = ArgumentCaptor.forClass(AiInsight.class);
        verify(fixture.aiInsightRepository()).save(insightCaptor.capture());
        assertTrue(insightCaptor.getValue().getSuggestedEventsJson().contains("\"costumeIds\":[12]"));

        ArgumentCaptor<String> systemPromptCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> inputPromptCaptor = ArgumentCaptor.forClass(String.class);
        verify(fixture.geminiClient(), times(1)).generateText(
                eq(AiCallType.INSIGHT),
                systemPromptCaptor.capture(),
                inputPromptCaptor.capture()
        );
        assertTrue(systemPromptCaptor.getValue().contains("SUGGESTED_EVENTS_JSON"));
        assertTrue(systemPromptCaptor.getValue().contains("không được bịa ID ngoài danh sách"));
        assertTrue(inputPromptCaptor.getValue().contains(
                "Danh mục nhu cầu cao nhưng chưa có event: Đầm dạ hội [slug=dam-da-hoi, demand=1]"
        ));
        assertTrue(inputPromptCaptor.getValue().contains(
                "Sản phẩm nhu cầu cao nhưng tồn kho thấp: ID=12, tên=Đầm Ruby"
        ));
    }

    @Test
    void generateWeeklyInsight_shouldKeepContentAndStoreNullWhenSuggestedJsonIsMalformed() {
        AnalystFixture fixture = fixture();
        when(fixture.geminiClient().generateText(eq(AiCallType.INSIGHT), any(), any()))
                .thenReturn("Phân tích tuần vẫn hợp lệ.\nSUGGESTED_EVENTS_JSON: [{bad}]");

        AiInsightResponse response = fixture.service().generateWeeklyInsight();

        assertEquals("Phân tích tuần vẫn hợp lệ.", response.content());
        assertTrue(response.suggestedEvents().isEmpty());
        ArgumentCaptor<AiInsight> insightCaptor = ArgumentCaptor.forClass(AiInsight.class);
        verify(fixture.aiInsightRepository()).save(insightCaptor.capture());
        assertNull(insightCaptor.getValue().getSuggestedEventsJson());
        verify(fixture.geminiClient(), times(1)).generateText(eq(AiCallType.INSIGHT), any(), any());
    }

    @Test
    void generateWeeklyInsight_shouldStoreEmptyArrayWhenGeminiReturnsNoSuggestions() {
        AnalystFixture fixture = fixture();
        when(fixture.geminiClient().generateText(eq(AiCallType.INSIGHT), any(), any()))
                .thenReturn("Không có tín hiệu đủ mạnh.\nSUGGESTED_EVENTS_JSON: []");

        AiInsightResponse response = fixture.service().generateWeeklyInsight();

        assertEquals("Không có tín hiệu đủ mạnh.", response.content());
        assertTrue(response.suggestedEvents().isEmpty());
        ArgumentCaptor<AiInsight> insightCaptor = ArgumentCaptor.forClass(AiInsight.class);
        verify(fixture.aiInsightRepository()).save(insightCaptor.capture());
        assertEquals("[]", insightCaptor.getValue().getSuggestedEventsJson());
        verify(fixture.geminiClient(), times(1)).generateText(eq(AiCallType.INSIGHT), any(), any());
    }

    @Test
    void generateWeeklyInsight_shouldRejectCostumeIdsOutsideSuppliedLowStockList() {
        AnalystFixture fixture = fixture();
        when(fixture.geminiClient().generateText(eq(AiCallType.INSIGHT), any(), any()))
                .thenReturn("""
                        Không có sản phẩm tồn kho thấp hợp lệ để gắn event.
                        SUGGESTED_EVENTS_JSON: [{"name":"Sai ID","reason":"Không hợp lệ","categorySlug":"dam-da-hoi","suggestedDiscountPercent":10,"costumeIds":[999]}]
                        """);

        AiInsightResponse response = fixture.service().generateWeeklyInsight();

        assertEquals("Không có sản phẩm tồn kho thấp hợp lệ để gắn event.", response.content());
        assertTrue(response.suggestedEvents().isEmpty());
        ArgumentCaptor<AiInsight> insightCaptor = ArgumentCaptor.forClass(AiInsight.class);
        verify(fixture.aiInsightRepository()).save(insightCaptor.capture());
        assertNull(insightCaptor.getValue().getSuggestedEventsJson());
    }

    private AnalystFixture fixture() {
        ChatMessageRepository chatMessageRepository = mock(ChatMessageRepository.class);
        UserInteractionEventRepository interactionRepository = mock(UserInteractionEventRepository.class);
        AiInsightRepository aiInsightRepository = mock(AiInsightRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        CostumeRepository costumeRepository = mock(CostumeRepository.class);
        InventoryRepository inventoryRepository = mock(InventoryRepository.class);
        EventRepository eventRepository = mock(EventRepository.class);
        GeminiClient geminiClient = mock(GeminiClient.class);

        when(chatMessageRepository.findIntentJsonByRoleAndPeriod(any(), any(), any()))
                .thenReturn(List.of());
        when(interactionRepository.countByEventTypeForPeriod(any(), any())).thenReturn(List.of());
        when(interactionRepository.findEventTypeAndMetadataForPeriod(any(), any(), any()))
                .thenReturn(List.of());
        when(aiInsightRepository.save(any(AiInsight.class))).thenAnswer(invocation -> {
            AiInsight insight = invocation.getArgument(0);
            insight.setId(100L);
            return insight;
        });

        AiAnalystServiceImpl service = new AiAnalystServiceImpl(
                chatMessageRepository,
                interactionRepository,
                aiInsightRepository,
                categoryRepository,
                costumeRepository,
                inventoryRepository,
                eventRepository,
                geminiClient,
                new ObjectMapper().findAndRegisterModules(),
                3
        );
        return new AnalystFixture(
                service,
                interactionRepository,
                aiInsightRepository,
                categoryRepository,
                costumeRepository,
                inventoryRepository,
                eventRepository,
                geminiClient
        );
    }

    private record AnalystFixture(
            AiAnalystServiceImpl service,
            UserInteractionEventRepository interactionRepository,
            AiInsightRepository aiInsightRepository,
            CategoryRepository categoryRepository,
            CostumeRepository costumeRepository,
            InventoryRepository inventoryRepository,
            EventRepository eventRepository,
            GeminiClient geminiClient
    ) {
    }
}
