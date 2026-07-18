package com.aurafit.service.stylist.impl;

import com.aurafit.enums.AiCallType;
import com.aurafit.enums.AiErrorType;
import com.aurafit.exception.AiProviderException;
import com.aurafit.integration.ai.GeminiClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StylistIntentServiceTest {

    @Test
    void extractIntent_shouldMapMalformedModelOutputToInvalidResponse() {
        GeminiClient geminiClient = mock(GeminiClient.class);
        when(geminiClient.generateJson(
                eq(AiCallType.INTENT_EXTRACTION),
                anyString(),
                anyString()
        )).thenReturn("not-json");
        StylistIntentServiceImpl service = new StylistIntentServiceImpl(geminiClient, new ObjectMapper());

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> service.extractIntent("Tìm váy đỏ", List.of())
        );

        assertEquals(AiErrorType.INVALID_RESPONSE, exception.getErrorType());
        assertEquals(
                "Có chút trục trặc khi xử lý câu trả lời, bạn thử hỏi lại theo cách khác nhé",
                exception.getUserFriendlyMessage()
        );
    }
}
