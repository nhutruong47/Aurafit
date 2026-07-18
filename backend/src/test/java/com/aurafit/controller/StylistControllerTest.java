package com.aurafit.controller;

import com.aurafit.dto.request.ChatMessageRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.ChatMessageResponse;
import com.aurafit.enums.AiErrorType;
import com.aurafit.exception.AiProviderException;
import com.aurafit.service.UserService;
import com.aurafit.service.stylist.StylistRecommendationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StylistControllerTest {

    @Test
    void chat_shouldReturnHttp200WithTypedErrorWhenProviderExceptionEscapesService() {
        StylistRecommendationService recommendationService = mock(StylistRecommendationService.class);
        StylistController controller = new StylistController(
                recommendationService,
                mock(UserService.class)
        );
        when(recommendationService.handleUserMessage("session-1", null, "Tìm váy đỏ"))
                .thenThrow(new AiProviderException(
                        AiErrorType.AUTH_ERROR,
                        "Gemini returned HTTP 401: invalid key",
                        "Hệ thống tư vấn AI đang tạm thời gián đoạn, vui lòng thử lại sau"
                ));

        ResponseEntity<ApiResponse<ChatMessageResponse>> response = controller.chat(
                null,
                new ChatMessageRequest("session-1", "Tìm váy đỏ")
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        ChatMessageResponse responseData = response.getBody().getData();
        assertNotNull(responseData);
        assertTrue(responseData.hasError());
        assertEquals(AiErrorType.AUTH_ERROR.name(), responseData.errorType());
        assertEquals(
                "Hệ thống tư vấn AI đang tạm thời gián đoạn, vui lòng thử lại sau",
                responseData.replyText()
        );
    }
}
