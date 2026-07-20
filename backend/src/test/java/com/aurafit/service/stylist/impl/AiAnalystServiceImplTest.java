package com.aurafit.service.stylist.impl;

import com.aurafit.enums.InteractionEventType;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.repository.AiInsightRepository;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
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
                mock(GeminiClient.class),
                new ObjectMapper()
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
}
