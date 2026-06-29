package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.dto.response.AiStylistSessionAttachResponse;
import com.aurafit.dto.request.CreateAiStylistSessionRequest;
import com.aurafit.dto.request.SendAiStylistMessageRequest;
import com.aurafit.dto.response.AiStylistSessionDTO;
import com.aurafit.entity.AiStylistMessage;
import com.aurafit.entity.AiStylistSession;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.AiStylistMessageRole;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;
import com.aurafit.enums.ItemStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.repository.AiStylistSessionRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.RentalOrderDetailRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AiExplanationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AiStylistServiceImplTest {

    @Mock
    private AiStylistSessionRepository aiStylistSessionRepository;

    @Mock
    private CostumeRepository costumeRepository;

    @Mock
    private RentalOrderDetailRepository rentalOrderDetailRepository;

    @Mock
    private UserInteractionEventRepository userInteractionEventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiExplanationService aiExplanationService;

    private AiStylistServiceImpl aiStylistService;

    @BeforeEach
    void setUp() {
        aiStylistService = new AiStylistServiceImpl(
                aiStylistSessionRepository,
                costumeRepository,
                rentalOrderDetailRepository,
                userInteractionEventRepository,
                userRepository,
                new ObjectMapper(),
                aiExplanationService
        );
        lenient().when(userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(List.of());
        lenient().when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(anyLong()))
                .thenReturn(List.of());
        lenient().when(aiExplanationService.enhanceRecommendationReasons(anyString(), anyString(), anyList()))
                .thenAnswer(invocation -> invocation.getArgument(2));
    }

    @Test
    void createSession_ShouldCreateGuestSessionWithIntroMessage() {
        Costume contextCostume = costume(
                1L,
                "Red Gala Dress",
                category(1L, "Events"),
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );

        when(costumeRepository.findByIdWithItems(1L)).thenReturn(Optional.of(contextCostume));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE)).thenReturn(List.of(contextCostume));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> {
            AiStylistSession session = invocation.getArgument(0);
            if (session.getId() == null) {
                session.setId(99L);
            }
            if (session.getCreatedAt() == null) {
                session.setCreatedAt(LocalDateTime.now());
            }
            session.setUpdatedAt(LocalDateTime.now());
            return session;
        });

        AiStylistSessionDTO result = aiStylistService.createSession(
                new CreateAiStylistSessionRequest("guest-001", 1L),
                null
        );

        assertEquals(99L, result.id());
        assertEquals("guest-001", result.guestSessionId());
        assertEquals(1, result.messages().size());
        assertEquals(AiStylistMessageRole.ASSISTANT, result.messages().get(0).role());
        assertTrue(result.messages().get(0).content().contains("AI Stylist da san sang"));
    }

    @Test
    void sendMessage_ShouldReturnCatalogGroundedRecommendations() {
        Category events = category(1L, "Events");
        Costume selectedCostume = costume(
                1L,
                "Red Gala Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume matchingCandidate = costume(
                2L,
                "Velvet Red Evening Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        Costume outOfBudgetCandidate = costume(
                3L,
                "Premium Couture Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Black", "formal"),
                ItemStatus.AVAILABLE
        );
        outOfBudgetCandidate.setRentalPrice(BigDecimal.valueOf(450_000));

        AiStylistSession session = AiStylistSession.builder()
                .id(7L)
                .guestSessionId("guest-001")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist da san sang.")
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(7L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(outOfBudgetCandidate, matchingCandidate, selectedCostume));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> {
            AiStylistSession savedSession = invocation.getArgument(0);
            long nextId = 10L;
            for (AiStylistMessage message : savedSession.getMessages()) {
                if (message.getId() == null) {
                    message.setId(nextId++);
                    message.setCreatedAt(LocalDateTime.now());
                }
            }
            if (savedSession.getCreatedAt() == null) {
                savedSession.setCreatedAt(LocalDateTime.now());
            }
            savedSession.setUpdatedAt(LocalDateTime.now());
            return savedSession;
        });

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(7L, "guest-001", 1L, null, null, "Can goi y bo tuong tu mau do duoi 300k"),
                null
        );

        assertEquals(3, result.messages().size());
        assertEquals(AiStylistMessageRole.USER, result.messages().get(1).role());
        assertEquals(AiStylistMessageRole.ASSISTANT, result.messages().get(2).role());
        assertFalse(result.messages().get(2).recommendations().isEmpty());
        assertTrue(result.messages().get(2).content().contains("catalog"));
        assertTrue(
                result.messages().get(2).recommendations().stream()
                        .anyMatch(item -> item.costume().id().equals(2L))
        );
        assertTrue(result.messages().get(2).recommendations().stream().allMatch(item -> item.availableItemCount() > 0));
        verify(rentalOrderDetailRepository, never()).findBookedCostumeItemIdsForPeriod(anyCollection(), any(), any(), any());
    }

    @Test
    void sendMessage_ShouldFilterRecommendationsByRentalPeriod() {
        Category events = category(1L, "Events");
        Costume selectedCostume = costume(
                1L,
                "Red Gala Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume availableCandidate = costume(
                2L,
                "Velvet Red Evening Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume blockedCandidate = costume(
                3L,
                "Ruby Event Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(8L)
                .guestSessionId("guest-001")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist da san sang.")
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(8L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(blockedCandidate, availableCandidate, selectedCostume));
        when(rentalOrderDetailRepository.findBookedCostumeItemIdsForPeriod(anyCollection(), any(), any(), any()))
                .thenReturn(List.of(31L));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> {
            AiStylistSession savedSession = invocation.getArgument(0);
            long nextId = 20L;
            for (AiStylistMessage message : savedSession.getMessages()) {
                if (message.getId() == null) {
                    message.setId(nextId++);
                    message.setCreatedAt(LocalDateTime.now());
                }
            }
            if (savedSession.getCreatedAt() == null) {
                savedSession.setCreatedAt(LocalDateTime.now());
            }
            savedSession.setUpdatedAt(LocalDateTime.now());
            return savedSession;
        });

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(
                        8L,
                        "guest-001",
                        1L,
                        LocalDate.of(2026, 7, 10),
                        LocalDate.of(2026, 7, 12),
                        "Can goi y bo tuong tu mau do"
                ),
                null
        );

        assertFalse(result.messages().get(2).recommendations().isEmpty());
        assertTrue(result.messages().get(2).content().contains("2026-07-10 den 2026-07-12"));
        assertTrue(
                result.messages().get(2).recommendations().stream()
                        .noneMatch(item -> item.costume().id().equals(3L))
        );
        assertTrue(
                result.messages().get(2).recommendations().stream()
                        .anyMatch(item -> item.costume().id().equals(2L))
        );
    }

    @Test
    void sendMessage_ShouldPersonalizeRecommendationsFromRecentInteractionHistory() {
        User user = user(21L, "history@aurafit.vn");
        Category yearbook = category(2L, "Yearbook");
        Costume historyMatch = costume(
                2L,
                "Classic White Yearbook Dress",
                yearbook,
                metadata("Classic", "Yearbook", "Spring", "White", "portrait"),
                ItemStatus.AVAILABLE
        );
        Costume weakerCandidate = costume(
                3L,
                "Blue Event Dress",
                yearbook,
                metadata("Modern", "Event", "Summer", "Blue", "party"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(9L)
                .user(user)
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist da san sang.")
                                .build()
                )))
                .build();

        UserInteractionEvent recentViewEvent = interactionEvent(
                501L,
                user,
                "session-auth",
                InteractionEventType.VIEW_PRODUCT,
                InteractionTargetType.COSTUME,
                "2",
                null,
                "{\"style\":\"Classic\",\"occasion\":\"Yearbook\",\"season\":\"Spring\",\"category\":\"Yearbook\",\"color\":\"White\",\"tags\":[\"portrait\"]}",
                LocalDateTime.now()
        );

        when(userRepository.findByEmail("history@aurafit.vn")).thenReturn(Optional.of(user));
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(21L))
                .thenReturn(List.of(recentViewEvent));
        when(aiStylistSessionRepository.findByIdWithMessages(9L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(weakerCandidate, historyMatch));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 30L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(9L, null, null, null, null, "Goi y cho minh costume phu hop"),
                "history@aurafit.vn"
        );

        assertFalse(result.messages().get(2).recommendations().isEmpty());
        assertEquals(2L, result.messages().get(2).recommendations().get(0).costume().id());
        assertTrue(result.messages().get(2).content().contains("hanh vi ban da xem va tim gan day"));
        assertTrue(result.messages().get(2).recommendations().get(0).reason().contains("Gan voi costume ban da xem"));
    }

    @Test
    void sendMessage_ShouldFilterRecommendationsByRequestedSize() {
        Category events = category(3L, "Events");
        Costume xlCandidate = costume(
                4L,
                "Red XL Gala Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        xlCandidate.getItems().forEach(item -> item.setSize("XL"));

        Costume mOnlyCandidate = costume(
                5L,
                "Red Medium Gala Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        mOnlyCandidate.getItems().forEach(item -> item.setSize("M"));

        AiStylistSession session = AiStylistSession.builder()
                .id(10L)
                .guestSessionId("guest-size")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist da san sang.")
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(10L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(mOnlyCandidate, xlCandidate));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 40L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(10L, "guest-size", null, null, null, "Can goi y costume mau do size XL"),
                null
        );

        assertEquals(1, result.messages().get(2).recommendations().size());
        assertEquals(4L, result.messages().get(2).recommendations().get(0).costume().id());
        assertTrue(result.messages().get(2).recommendations().get(0).reason().contains("size XL"));
    }

    @Test
    void attachGuestSessionsToUser_ShouldAttachGuestSessionsAndPreferRequestedSession() {
        User user = user(11L, "stylist@aurafit.vn");
        AiStylistSession existingUserSession = session(60L, null, user, LocalDateTime.of(2026, 6, 25, 9, 0));
        AiStylistSession guestSession = session(70L, "guest-001", null, LocalDateTime.of(2026, 6, 27, 10, 0));
        guestSession.setMessages(new ArrayList<>(List.of(
                AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.ASSISTANT).content("intro").build(),
                AiStylistMessage.builder().id(2L).role(AiStylistMessageRole.USER).content("hello").build()
        )));

        when(userRepository.findByEmail("stylist@aurafit.vn")).thenReturn(Optional.of(user));
        when(aiStylistSessionRepository.findGuestSessionsForAttach("guest-001")).thenReturn(List.of(guestSession));
        when(aiStylistSessionRepository.findTopByUser_IdOrderByUpdatedAtDescIdDesc(11L)).thenReturn(Optional.of(existingUserSession));
        when(aiStylistSessionRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AiStylistSessionAttachResponse result = aiStylistService.attachGuestSessionsToUser("guest-001", 70L, "stylist@aurafit.vn");

        assertEquals(1, result.attachedSessionCount());
        assertEquals(70L, result.preferredSessionId());
        assertEquals(user, guestSession.getUser());
        assertEquals(2, guestSession.getMessages().size());
    }

    @Test
    void attachGuestSessionsToUser_ShouldBeIdempotentWhenSessionAlreadyAttached() {
        User user = user(11L, "stylist@aurafit.vn");
        AiStylistSession attachedSession = session(70L, "guest-001", user, LocalDateTime.of(2026, 6, 27, 10, 0));
        attachedSession.setMessages(new ArrayList<>(List.of(
                AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.ASSISTANT).content("intro").build(),
                AiStylistMessage.builder().id(2L).role(AiStylistMessageRole.USER).content("hello").build()
        )));

        when(userRepository.findByEmail("stylist@aurafit.vn")).thenReturn(Optional.of(user));
        when(aiStylistSessionRepository.findGuestSessionsForAttach("guest-001")).thenReturn(List.of());
        when(aiStylistSessionRepository.findTopByUser_IdOrderByUpdatedAtDescIdDesc(11L)).thenReturn(Optional.of(attachedSession));
        when(aiStylistSessionRepository.findByIdAndUser_Id(70L, 11L)).thenReturn(Optional.of(attachedSession));

        AiStylistSessionAttachResponse result = aiStylistService.attachGuestSessionsToUser("guest-001", 70L, "stylist@aurafit.vn");

        assertEquals(0, result.attachedSessionCount());
        assertEquals(70L, result.preferredSessionId());
        assertEquals(2, attachedSession.getMessages().size());
        verify(aiStylistSessionRepository, never()).saveAll(any());
    }

    @Test
    void getSession_ShouldRejectGuestSessionMismatch() {
        AiStylistSession session = AiStylistSession.builder()
                .id(5L)
                .guestSessionId("guest-001")
                .messages(new ArrayList<>())
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(5L)).thenReturn(Optional.of(session));

        assertThrows(BadRequestException.class, () -> aiStylistService.getSession(5L, "guest-999", null));
    }

    private Category category(Long id, String name) {
        return Category.builder()
                .id(id)
                .name(name)
                .description(name + " category")
                .build();
    }

    private User user(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }

    private CostumeMetadata metadata(String style, String occasion, String season, String color, String... tags) {
        return CostumeMetadata.builder()
                .style(style)
                .occasion(occasion)
                .season(season)
                .color(color)
                .tags(new ArrayList<>(List.of(tags)))
                .build();
    }

    private Costume costume(Long id, String name, Category category, CostumeMetadata metadata, ItemStatus... itemStatuses) {
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

        if (metadata != null) {
            metadata.setCostume(costume);
            costume.setMetadata(metadata);
        }

        List<CostumeItem> items = new ArrayList<>();
        for (int index = 0; index < itemStatuses.length; index++) {
            items.add(CostumeItem.builder()
                    .id(id * 10 + index + 1)
                    .sku("SKU-" + id + "-" + (index + 1))
                    .size("M")
                    .color(metadata != null ? metadata.getColor() : "Black")
                    .status(itemStatuses[index])
                    .costume(costume)
                    .build());
        }
        costume.setItems(items);
        return costume;
    }

    private UserInteractionEvent interactionEvent(
            Long id,
            User user,
            String sessionId,
            InteractionEventType eventType,
            InteractionTargetType targetType,
            String targetId,
            String queryText,
            String metadataJson,
            LocalDateTime createdAt
    ) {
        UserInteractionEvent event = UserInteractionEvent.builder()
                .id(id)
                .user(user)
                .sessionId(sessionId)
                .eventType(eventType)
                .targetType(targetType)
                .targetId(targetId)
                .queryText(queryText)
                .metadataJson(metadataJson)
                .build();
        event.setCreatedAt(createdAt);
        return event;
    }

    private AiStylistSession persistSession(AiStylistSession session, long nextMessageIdStart) {
        long nextId = nextMessageIdStart;
        for (AiStylistMessage message : session.getMessages()) {
            if (message.getId() == null) {
                message.setId(nextId++);
                message.setCreatedAt(LocalDateTime.now());
            }
        }
        if (session.getCreatedAt() == null) {
            session.setCreatedAt(LocalDateTime.now());
        }
        session.setUpdatedAt(LocalDateTime.now());
        return session;
    }

    private AiStylistSession session(Long id, String guestSessionId, User user, LocalDateTime updatedAt) {
        AiStylistSession session = AiStylistSession.builder()
                .id(id)
                .guestSessionId(guestSessionId)
                .user(user)
                .messages(new ArrayList<>())
                .build();
        session.setCreatedAt(updatedAt.minusHours(1));
        session.setUpdatedAt(updatedAt);
        return session;
    }
}
