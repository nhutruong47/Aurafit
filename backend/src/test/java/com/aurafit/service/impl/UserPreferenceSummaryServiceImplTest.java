package com.aurafit.service.impl;

import com.aurafit.dto.request.TrackInteractionRequest;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.UserPreferenceSummaryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserPreferenceSummaryServiceImplTest {

    @Mock
    private UserInteractionEventRepository userInteractionEventRepository;

    @Mock
    private CostumeRepository costumeRepository;

    @Mock
    private UserRepository userRepository;

    private UserPreferenceSummaryServiceImpl userPreferenceSummaryService;
    private UserInteractionServiceImpl userInteractionService;

    @BeforeEach
    void setUp() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager(UserPreferenceSummaryService.CACHE_NAME);
        userPreferenceSummaryService = new UserPreferenceSummaryServiceImpl(
                userInteractionEventRepository,
                costumeRepository,
                new ObjectMapper(),
                cacheManager
        );
        userInteractionService = new UserInteractionServiceImpl(
                userInteractionEventRepository,
                userRepository,
                cacheManager
        );

        lenient().when(userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(List.of());
        lenient().when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(anyLong()))
                .thenReturn(List.of());
        lenient().when(costumeRepository.findAllById(ArgumentMatchers.<Iterable<Long>>any()))
                .thenReturn(List.of());
    }

    @Test
    void summarize_ShouldBuildNaturalLanguageSummaryFromRecentEvents() {
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(42L)).thenReturn(List.of(
                event(1L, "session-42", InteractionEventType.VIEW_PRODUCT, "11",
                        "{\"style\":\"Elegant\",\"occasion\":\"Gala\",\"color\":\"Black\"}",
                        LocalDateTime.of(2026, 7, 13, 10, 0)),
                event(2L, "session-42", InteractionEventType.ADD_TO_CART, "12",
                        "{\"style\":\"Elegant\",\"occasion\":\"Gala\",\"color\":\"Black\"}",
                        LocalDateTime.of(2026, 7, 13, 9, 0)),
                event(3L, "session-42", InteractionEventType.CHAT_QUERY, null,
                        "{\"style\":\"Elegant\",\"occasion\":\"Gala\",\"color\":\"Red\"}",
                        LocalDateTime.of(2026, 7, 13, 8, 0))
        ));
        when(costumeRepository.findAllById(ArgumentMatchers.<Iterable<Long>>any())).thenReturn(List.of(
                costume(11L, "Midnight Satin Gown", "Elegant", "Gala", "Black"),
                costume(12L, "Silver Evening Dress", "Elegant", "Gala", "Silver")
        ));

        String summary = userPreferenceSummaryService.summarize("42", null);

        assertEquals(
                "User thường quan tâm đồ phong cách Elegant, dịp Gala, màu Black. Gần đây đã quan tâm: Midnight Satin Gown, Silver Evening Dress.",
                summary
        );
    }

    @Test
    void summarize_ShouldReturnNullWhenNoEvents() {
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(99L)).thenReturn(List.of());

        String summary = userPreferenceSummaryService.summarize("99", null);

        assertNull(summary);
    }

    @Test
    void summarize_ShouldHandleMissingMetadataGracefully() {
        when(userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc("guest-new")).thenReturn(List.of(
                event(4L, "guest-new", InteractionEventType.VIEW_PRODUCT, "15", "{}",
                        LocalDateTime.of(2026, 7, 13, 11, 0)),
                event(5L, "guest-new", InteractionEventType.RECOMMENDATION_CLICK, "16", "not-json",
                        LocalDateTime.of(2026, 7, 13, 10, 30))
        ));
        when(costumeRepository.findAllById(ArgumentMatchers.<Iterable<Long>>any())).thenReturn(List.of(
                costume(15L, "Blue Modern Suit", "Modern", "Business", "Blue"),
                costume(16L, "Graphite City Blazer", "Modern", "Business", "Gray")
        ));

        String summary = userPreferenceSummaryService.summarize(null, "guest-new");

        assertTrue(summary.contains("phong cách Modern"));
        assertTrue(summary.contains("Blue Modern Suit"));
        assertTrue(summary.contains("Graphite City Blazer"));
    }

    @Test
    void summarize_ShouldReuseCacheForRepeatedCalls() {
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(42L)).thenReturn(List.of(
                event(6L, "session-42", InteractionEventType.VIEW_PRODUCT, "21",
                        "{\"style\":\"Classic\",\"occasion\":\"Tiệc tối\",\"color\":\"Navy\"}",
                        LocalDateTime.of(2026, 7, 13, 12, 0))
        ));
        when(costumeRepository.findAllById(ArgumentMatchers.<Iterable<Long>>any())).thenReturn(List.of(
                costume(21L, "Navy Evening Suit", "Classic", "Tiệc tối", "Navy")
        ));

        String firstSummary = userPreferenceSummaryService.summarize("42", "session-42");
        String secondSummary = userPreferenceSummaryService.summarize("42", "session-42");

        assertEquals(firstSummary, secondSummary);
        verify(userInteractionEventRepository, times(1)).findTop60ByUser_IdOrderByCreatedAtDesc(42L);
        verify(userInteractionEventRepository, times(1)).findTop60BySessionIdOrderByCreatedAtDesc("session-42");
        verify(costumeRepository, times(1)).findAllById(ArgumentMatchers.<Iterable<Long>>any());
    }

    @Test
    void summarize_ShouldQueryRepositoryAgainAfterImportantEventInvalidatesCache() {
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(42L)).thenReturn(List.of(
                event(7L, "session-42", InteractionEventType.VIEW_PRODUCT, "31",
                        "{\"style\":\"Elegant\",\"occasion\":\"Gala\",\"color\":\"Black\"}",
                        LocalDateTime.of(2026, 7, 13, 13, 0))
        ));
        when(costumeRepository.findAllById(ArgumentMatchers.<Iterable<Long>>any())).thenReturn(List.of(
                costume(31L, "Black Gala Dress", "Elegant", "Gala", "Black")
        ));
        when(userRepository.findByEmail("history@aurafit.vn")).thenReturn(Optional.of(user(42L, "history@aurafit.vn")));

        String firstSummary = userPreferenceSummaryService.summarize("42", "session-42");
        String cachedSummary = userPreferenceSummaryService.summarize("42", "session-42");

        userInteractionService.track(
                new TrackInteractionRequest(
                        "session-42",
                        InteractionEventType.ADD_TO_CART,
                        InteractionTargetType.COSTUME,
                        "31",
                        null,
                        "/products/31",
                        "{\"style\":\"Elegant\",\"occasion\":\"Gala\",\"color\":\"Black\"}"
                ),
                "history@aurafit.vn"
        );

        String refreshedSummary = userPreferenceSummaryService.summarize("42", "session-42");

        assertEquals(firstSummary, cachedSummary);
        assertEquals(firstSummary, refreshedSummary);
        verify(userInteractionEventRepository, times(2)).findTop60ByUser_IdOrderByCreatedAtDesc(42L);
        verify(userInteractionEventRepository, times(2)).findTop60BySessionIdOrderByCreatedAtDesc("session-42");
    }

    private UserInteractionEvent event(Long id,
                                       String sessionId,
                                       InteractionEventType eventType,
                                       String targetId,
                                       String metadataJson,
                                       LocalDateTime createdAt) {
        UserInteractionEvent event = UserInteractionEvent.builder()
                .id(id)
                .sessionId(sessionId)
                .eventType(eventType)
                .targetType(targetId != null ? InteractionTargetType.COSTUME : null)
                .targetId(targetId)
                .metadataJson(metadataJson)
                .build();
        event.setCreatedAt(createdAt);
        return event;
    }

    private Costume costume(Long id, String name, String style, String occasion, String color) {
        CostumeMetadata metadata = CostumeMetadata.builder()
                .style(style)
                .occasion(occasion)
                .season("All season")
                .color(color)
                .tags(List.of("formal"))
                .build();

        Costume costume = Costume.builder()
                .id(id)
                .name(name)
                .metadata(metadata)
                .build();
        metadata.setCostume(costume);
        return costume;
    }

    private User user(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }
}
