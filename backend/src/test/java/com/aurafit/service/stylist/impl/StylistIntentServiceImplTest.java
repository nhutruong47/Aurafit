package com.aurafit.service.stylist.impl;

import com.aurafit.entity.ChatMessage;
import com.aurafit.enums.AiCallType;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.integration.ai.GeminiClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StylistIntentServiceImplTest {

    @Mock
    private GeminiClient geminiClient;

    @Test
    void extractIntent_shouldUseLastThreeConversationTurnsIncludingAssistantRecommendations() {
        StylistIntentServiceImpl service = new StylistIntentServiceImpl(geminiClient, new ObjectMapper());
        List<ChatMessage> history = new ArrayList<>();
        for (int index = 1; index <= 7; index++) {
            ChatMessageRole role = index % 2 == 0 ? ChatMessageRole.ASSISTANT : ChatMessageRole.USER;
            ChatMessage message = ChatMessage.builder()
                    .id((long) index)
                    .role(role)
                    .content("Tin nhắn " + index)
                    .recommendedCostumeIds(role == ChatMessageRole.ASSISTANT ? index + "," + (index + 10) : null)
                    .build();
            message.setCreatedAt(LocalDateTime.of(2026, 7, 22, 10, index));
            history.add(message);
        }
        when(geminiClient.generateJson(eq(AiCallType.INTENT_EXTRACTION), any(), any()))
                .thenReturn("{\"category\":null,\"style\":null,\"occasion\":null,\"season\":null,"
                        + "\"color\":\"đen\",\"gender\":null,\"tags\":null,"
                        + "\"minBudget\":null,\"maxBudget\":null}");

        service.extractIntent("đổi sang màu đen", history);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient).generateJson(
                eq(AiCallType.INTENT_EXTRACTION),
                any(),
                promptCaptor.capture()
        );
        String prompt = promptCaptor.getValue();
        assertFalse(prompt.contains("Tin nhắn 1"));
        assertTrue(prompt.contains("Tin nhắn 2"));
        assertTrue(prompt.contains("Tin nhắn 7"));
        assertTrue(prompt.contains("Stylist: Tin nhắn 6 [ID sản phẩm đã gợi ý: 6,16]"));
        assertTrue(prompt.contains("Tin nhắn cần phân tích:\nđổi sang màu đen"));
        assertEquals(1, prompt.split("Tin nhắn 2", -1).length - 1);
    }
}
