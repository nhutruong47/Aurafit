package com.aurafit.service.stylist.impl;

import com.aurafit.dto.response.ChatSessionDetailDTO;
import com.aurafit.dto.response.ChatSessionSummaryDTO;
import com.aurafit.entity.Category;
import com.aurafit.entity.ChatMessage;
import com.aurafit.entity.ChatSession;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.enums.ItemStatus;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.ChatSessionRepository;
import com.aurafit.repository.CostumeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatHistoryServiceImplTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private CostumeRepository costumeRepository;

    private ChatHistoryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ChatHistoryServiceImpl(
                chatSessionRepository,
                chatMessageRepository,
                costumeRepository
        );
    }

    @Test
    void getSessionsForUser_shouldReturnEmptyForGuest() {
        assertEquals(List.of(), service.getSessionsForUser(null));
        verifyNoInteractions(chatSessionRepository, chatMessageRepository, costumeRepository);
    }

    @Test
    void getSessionsForUser_shouldBuildPreviewAndSummary() {
        ChatSession session = ChatSession.builder().sessionId("session-1").build();
        ChatMessage firstUserMessage = message(
                1L,
                session,
                ChatMessageRole.USER,
                "1234567890123456789012345678901234567890X",
                null,
                LocalDateTime.of(2026, 7, 19, 9, 0)
        );
        ChatMessage assistantMessage = message(
                2L,
                session,
                ChatMessageRole.ASSISTANT,
                "Gợi ý của stylist",
                null,
                LocalDateTime.of(2026, 7, 19, 9, 1)
        );

        when(chatSessionRepository.findByUserIdOrderByLastMessageDesc(10L))
                .thenReturn(List.of(session));
        when(chatMessageRepository.findByChatSessionOrderByCreatedAtAsc(session))
                .thenReturn(List.of(firstUserMessage, assistantMessage));
        when(chatMessageRepository.findFirstByChatSessionAndRoleOrderByCreatedAtAsc(
                session,
                ChatMessageRole.USER
        )).thenReturn(Optional.of(firstUserMessage));

        List<ChatSessionSummaryDTO> result = service.getSessionsForUser(10L);

        assertEquals(1, result.size());
        assertEquals("1234567890123456789012345678901234567890...", result.getFirst().previewText());
        assertEquals(assistantMessage.getCreatedAt(), result.getFirst().lastMessageAt());
        assertEquals(2, result.getFirst().messageCount());
    }

    @Test
    void getSessionDetail_shouldScopeAuthenticatedLookupAndMapRecommendations() {
        ChatSession session = ChatSession.builder().sessionId("session-2").build();
        ChatMessage userMessage = message(
                3L,
                session,
                ChatMessageRole.USER,
                "Tìm áo dài",
                "99",
                LocalDateTime.of(2026, 7, 19, 10, 0)
        );
        ChatMessage assistantMessage = message(
                4L,
                session,
                ChatMessageRole.ASSISTANT,
                "Bạn có thể thử mẫu này",
                "7,invalid,8",
                LocalDateTime.of(2026, 7, 19, 10, 1)
        );
        Costume costume7 = costume(7L, "Áo dài đỏ");
        Costume costume8 = costume(8L, "Áo dài xanh");

        when(chatSessionRepository.findBySessionIdAndUserId("session-2", 10L))
                .thenReturn(Optional.of(session));
        when(chatMessageRepository.findByChatSessionOrderByCreatedAtAsc(session))
                .thenReturn(List.of(userMessage, assistantMessage));
        when(costumeRepository.findAllByIdWithItems(List.of(7L, 8L)))
                .thenReturn(List.of(costume8, costume7));

        ChatSessionDetailDTO result = service.getSessionDetail("session-2", 10L);

        assertEquals("session-2", result.sessionId());
        assertEquals(List.of(), result.messages().getFirst().recommendedCostumes());
        assertEquals(
                List.of(7L, 8L),
                result.messages().get(1).recommendedCostumes().stream().map(costume -> costume.id()).toList()
        );
        verify(chatSessionRepository, never()).findBySessionIdAndUserIsNull("session-2");
    }

    @Test
    void getSessionDetail_shouldDenyGuestWhenSessionIsNotAnonymous() {
        when(chatSessionRepository.findBySessionIdAndUserIsNull("owned-session"))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.getSessionDetail("owned-session", null)
        );

        verify(chatSessionRepository, never()).findBySessionId("owned-session");
        verifyNoInteractions(chatMessageRepository, costumeRepository);
    }

    private ChatMessage message(
            Long id,
            ChatSession session,
            ChatMessageRole role,
            String content,
            String recommendedCostumeIds,
            LocalDateTime createdAt
    ) {
        ChatMessage message = ChatMessage.builder()
                .id(id)
                .chatSession(session)
                .role(role)
                .content(content)
                .recommendedCostumeIds(recommendedCostumeIds)
                .build();
        message.setCreatedAt(createdAt);
        return message;
    }

    private Costume costume(Long id, String name) {
        Category category = Category.builder().id(1L).name("Trang phục truyền thống").build();
        Costume costume = Costume.builder()
                .id(id)
                .name(name)
                .slug("costume-" + id)
                .rentalPrice(BigDecimal.valueOf(200_000))
                .depositPrice(BigDecimal.valueOf(500_000))
                .category(category)
                .build();
        costume.setItems(List.of(CostumeItem.builder()
                .id(id)
                .status(ItemStatus.AVAILABLE)
                .costume(costume)
                .build()));
        return costume;
    }
}
