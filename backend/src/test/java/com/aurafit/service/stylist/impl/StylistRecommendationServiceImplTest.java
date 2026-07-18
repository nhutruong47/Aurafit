package com.aurafit.service.stylist.impl;

import com.aurafit.dto.response.ChatMessageResponse;
import com.aurafit.entity.ChatMessage;
import com.aurafit.entity.ChatSession;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.enums.AiErrorType;
import com.aurafit.exception.AiProviderException;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.ChatSessionRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.stylist.StylistIntentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StylistRecommendationServiceImplTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private CostumeRepository costumeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StylistIntentService stylistIntentService;
    @Mock
    private GeminiClient geminiClient;

    private StylistRecommendationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new StylistRecommendationServiceImpl(
                chatSessionRepository,
                chatMessageRepository,
                costumeRepository,
                userRepository,
                stylistIntentService,
                geminiClient,
                new ObjectMapper()
        );
    }

    @Test
    void handleUserMessage_shouldStopBeforePersistenceAndAiWhenDailyLimitReached() {
        ChatSession session = ChatSession.builder().id(1L).sessionId("session-limit").build();
        when(chatSessionRepository.findBySessionId("session-limit")).thenReturn(Optional.of(session));
        when(chatMessageRepository
                .countByChatSessionAndRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        eq(session),
                        eq(ChatMessageRole.USER),
                        any(LocalDateTime.class),
                        any(LocalDateTime.class)
                ))
                .thenReturn(20L);

        ChatMessageResponse response = service.handleUserMessage("session-limit", null, "Tư vấn cho tôi");

        assertEquals("Bạn đã đạt giới hạn tư vấn hôm nay, vui lòng quay lại vào ngày mai", response.replyText());
        assertEquals(List.of(), response.recommendedCostumes());
        verify(chatMessageRepository, never()).save(any(ChatMessage.class));
        verifyNoInteractions(stylistIntentService, geminiClient, costumeRepository);
    }

    @Test
    @SuppressWarnings("unchecked")
    void handleUserMessage_shouldReuseIntentForNormalizedConsecutiveDuplicate() {
        ChatSession session = ChatSession.builder().id(2L).sessionId("session-cache").build();
        String cachedIntent = "{\"category\":null,\"style\":null,\"occasion\":null,\"season\":null,\"color\":\"đỏ\",\"gender\":null,\"tags\":null,\"minBudget\":null,\"maxBudget\":null}";
        ChatMessage previousMessage = ChatMessage.builder()
                .id(10L)
                .chatSession(session)
                .role(ChatMessageRole.USER)
                .content("  TÌM đồ đỏ!!! ")
                .intentJson(cachedIntent)
                .build();

        when(chatSessionRepository.findBySessionId("session-cache")).thenReturn(Optional.of(session));
        when(chatMessageRepository
                .countByChatSessionAndRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        eq(session),
                        eq(ChatMessageRole.USER),
                        any(LocalDateTime.class),
                        any(LocalDateTime.class)
                ))
                .thenReturn(1L);
        when(chatMessageRepository.findFirstByChatSessionAndRoleOrderByCreatedAtDesc(
                session,
                ChatMessageRole.USER
        )).thenReturn(Optional.of(previousMessage));
        when(chatMessageRepository.save(any(ChatMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(chatMessageRepository.findByChatSessionOrderByCreatedAtDesc(eq(session), any(Pageable.class)))
                .thenReturn(List.of());
        when(costumeRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        service.handleUserMessage("session-cache", null, "tìm ĐỒ đỏ");

        verify(stylistIntentService, never()).extractIntent(any(), any());
        verifyNoInteractions(geminiClient);

        ArgumentCaptor<ChatMessage> messageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository, atLeastOnce()).save(messageCaptor.capture());
        ChatMessage savedUserMessage = messageCaptor.getAllValues().stream()
                .filter(message -> message.getRole() == ChatMessageRole.USER)
                .findFirst()
                .orElseThrow();
        assertEquals(cachedIntent, savedUserMessage.getIntentJson());
    }

    @Test
    void handleUserMessage_shouldReturnTypedErrorAndPersistBothMessagesWhenProviderFails() {
        ChatSession session = ChatSession.builder().id(3L).sessionId("session-provider-error").build();
        when(chatSessionRepository.findBySessionId("session-provider-error"))
                .thenReturn(Optional.of(session));
        when(chatMessageRepository
                .countByChatSessionAndRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        eq(session),
                        eq(ChatMessageRole.USER),
                        any(LocalDateTime.class),
                        any(LocalDateTime.class)
                ))
                .thenReturn(0L);
        when(chatMessageRepository.findFirstByChatSessionAndRoleOrderByCreatedAtDesc(
                session,
                ChatMessageRole.USER
        )).thenReturn(Optional.empty());
        when(chatMessageRepository.save(any(ChatMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(chatMessageRepository.findByChatSessionOrderByCreatedAtDesc(eq(session), any(Pageable.class)))
                .thenReturn(List.of());
        when(stylistIntentService.extractIntent(any(), any()))
                .thenThrow(new AiProviderException(
                        AiErrorType.RATE_LIMIT_EXCEEDED,
                        "Gemini returned HTTP 429 with quota details",
                        "Hệ thống đang được nhiều người sử dụng, vui lòng thử lại sau ít phút"
                ));

        ChatMessageResponse response = service.handleUserMessage(
                "session-provider-error",
                null,
                "Tìm váy đỏ"
        );

        assertTrue(response.hasError());
        assertEquals(AiErrorType.RATE_LIMIT_EXCEEDED.name(), response.errorType());
        assertEquals(
                "Hệ thống đang được nhiều người sử dụng, vui lòng thử lại sau ít phút",
                response.replyText()
        );
        assertEquals(List.of(), response.recommendedCostumes());

        ArgumentCaptor<ChatMessage> messageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository, times(2)).save(messageCaptor.capture());
        assertEquals(ChatMessageRole.USER, messageCaptor.getAllValues().get(0).getRole());
        assertEquals(ChatMessageRole.ASSISTANT, messageCaptor.getAllValues().get(1).getRole());
        assertEquals(
                response.replyText(),
                messageCaptor.getAllValues().get(1).getContent()
        );
        verifyNoInteractions(geminiClient, costumeRepository);
    }
}
