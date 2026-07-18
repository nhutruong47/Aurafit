package com.aurafit.controller;

import com.aurafit.dto.request.ChatMessageRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.ChatMessageResponse;
import com.aurafit.dto.response.ChatSessionDetailDTO;
import com.aurafit.dto.response.ChatSessionSummaryDTO;
import com.aurafit.enums.AiErrorType;
import com.aurafit.exception.AiProviderException;
import com.aurafit.service.UserService;
import com.aurafit.service.stylist.ChatHistoryService;
import com.aurafit.service.stylist.StylistRecommendationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StylistControllerTest {

    @Test
    void chat_shouldReturnHttp200WithTypedErrorWhenProviderExceptionEscapesService() {
        StylistRecommendationService recommendationService = mock(StylistRecommendationService.class);
        StylistController controller = new StylistController(
                recommendationService,
                mock(ChatHistoryService.class),
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

    @Test
    void getSessions_shouldUseAuthenticatedUserId() {
        StylistRecommendationService recommendationService = mock(StylistRecommendationService.class);
        ChatHistoryService chatHistoryService = mock(ChatHistoryService.class);
        UserService userService = mock(UserService.class);
        StylistController controller = new StylistController(
                recommendationService,
                chatHistoryService,
                userService
        );
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken("user@aurafit.com", null, List.of());
        ChatSessionSummaryDTO summary = new ChatSessionSummaryDTO(
                "session-1",
                "Tìm váy đỏ",
                LocalDateTime.of(2026, 7, 19, 11, 0),
                2
        );
        when(userService.getUserIdByEmail("user@aurafit.com")).thenReturn(10L);
        when(chatHistoryService.getSessionsForUser(10L)).thenReturn(List.of(summary));

        ResponseEntity<ApiResponse<List<ChatSessionSummaryDTO>>> response =
                controller.getSessions(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(List.of(summary), response.getBody().getData());
        verify(chatHistoryService).getSessionsForUser(10L);
    }

    @Test
    void getSessionDetail_shouldAllowGuestLookupWithoutUserId() {
        ChatHistoryService chatHistoryService = mock(ChatHistoryService.class);
        StylistController controller = new StylistController(
                mock(StylistRecommendationService.class),
                chatHistoryService,
                mock(UserService.class)
        );
        ChatSessionDetailDTO detail = new ChatSessionDetailDTO("guest-session", List.of());
        when(chatHistoryService.getSessionDetail("guest-session", null)).thenReturn(detail);

        ResponseEntity<ApiResponse<ChatSessionDetailDTO>> response =
                controller.getSessionDetail(null, "guest-session");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(detail, response.getBody().getData());
        verify(chatHistoryService).getSessionDetail("guest-session", null);
    }
}
