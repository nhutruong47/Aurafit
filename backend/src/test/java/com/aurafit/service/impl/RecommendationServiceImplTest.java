package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;
import com.aurafit.enums.ItemStatus;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AiExplanationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceImplTest {

    @Mock
    private CostumeRepository costumeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserInteractionEventRepository userInteractionEventRepository;

    @Mock
    private AiExplanationService aiExplanationService;

    private RecommendationServiceImpl recommendationService;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationServiceImpl(
                costumeRepository,
                userRepository,
                userInteractionEventRepository,
                new ObjectMapper(),
                aiExplanationService
        );
        when(aiExplanationService.enhanceRecommendationReasons(anyString(), anyString(), anyString(), any(), any(), anyList()))
                .thenAnswer(invocation -> invocation.getArgument(5));
    }

    @Test
    void getSimilarCostumes_ShouldNotReturnCurrentCostume() {
        Category category = category(1L, "Anime");
        Costume source = costume(
                1L,
                "Source",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime", "hero"),
                ItemStatus.AVAILABLE
        );
        Costume sameCostumeReturnedByRepository = costume(
                1L,
                "Source Again",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime", "hero"),
                ItemStatus.AVAILABLE
        );
        Costume candidate = costume(
                2L,
                "Candidate",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime", "festival"),
                ItemStatus.AVAILABLE
        );

        when(costumeRepository.findByIdWithItems(1L)).thenReturn(Optional.of(source));
        when(costumeRepository.findActiveWithItemsExcludingId(CostumeStatus.ACTIVE, 1L))
                .thenReturn(List.of(sameCostumeReturnedByRepository, candidate));

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getSimilarCostumes(1L, 4);

        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).costume().id());
    }

    @Test
    void getSimilarCostumes_ShouldOnlyReturnCostumesWithAvailableItems() {
        Category category = category(1L, "Anime");
        Costume source = costume(
                1L,
                "Source",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime"),
                ItemStatus.AVAILABLE
        );
        Costume availableCandidate = costume(
                2L,
                "Available Candidate",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime"),
                ItemStatus.AVAILABLE
        );
        Costume unavailableCandidate = costume(
                3L,
                "Unavailable Candidate",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime"),
                ItemStatus.RENTED,
                ItemStatus.MAINTENANCE
        );

        when(costumeRepository.findByIdWithItems(1L)).thenReturn(Optional.of(source));
        when(costumeRepository.findActiveWithItemsExcludingId(CostumeStatus.ACTIVE, 1L))
                .thenReturn(List.of(availableCandidate, unavailableCandidate));

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getSimilarCostumes(1L, 4);

        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).costume().id());
        assertTrue(result.stream().allMatch(item -> item.availableItemCount() > 0));
    }

    @Test
    void getSimilarCostumes_ShouldScoreMetadataSignalsInExpectedOrder() {
        Category category = category(1L, "Anime");
        Costume source = costume(
                1L,
                "Source",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime", "hero"),
                ItemStatus.AVAILABLE
        );

        Costume fullMatch = costume(
                2L,
                "Full Match",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime", "hero"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        Costume styleOnly = costume(
                3L,
                "Style Only",
                category,
                metadata("Heroic", "Photoshoot", "Winter", "Blue", "dramatic"),
                ItemStatus.AVAILABLE
        );
        Costume occasionOnly = costume(
                4L,
                "Occasion Only",
                category,
                metadata("Modern", "Convention", "Winter", "Blue", "minimal"),
                ItemStatus.AVAILABLE
        );
        Costume seasonOnly = costume(
                5L,
                "Season Only",
                category,
                metadata("Modern", "Event", "Summer", "Blue", "minimal"),
                ItemStatus.AVAILABLE
        );
        Costume colorOnly = costume(
                6L,
                "Color Only",
                category,
                metadata("Modern", "Event", "Winter", "Red", "minimal"),
                ItemStatus.AVAILABLE
        );
        Costume tagsOnly = costume(
                7L,
                "Tags Only",
                category,
                metadata("Modern", "Event", "Winter", "Blue", "anime", "hero"),
                ItemStatus.AVAILABLE
        );

        when(costumeRepository.findByIdWithItems(1L)).thenReturn(Optional.of(source));
        when(costumeRepository.findActiveWithItemsExcludingId(CostumeStatus.ACTIVE, 1L))
                .thenReturn(List.of(tagsOnly, colorOnly, seasonOnly, occasionOnly, styleOnly, fullMatch));

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getSimilarCostumes(1L, 6);

        assertIterableEquals(
                List.of(2L, 3L, 4L, 5L, 6L, 7L),
                result.stream().map(item -> item.costume().id()).toList()
        );

        assertEquals(124, result.get(0).score());
        assertEquals("Cùng phong cách, phù hợp cùng dịp sử dụng", result.get(0).reason());

        assertEquals(51, result.get(1).score());
        assertEquals("Cùng phong cách", result.get(1).reason());

        assertEquals(39, result.get(2).score());
        assertEquals("Phù hợp cùng dịp sử dụng", result.get(2).reason());

        assertEquals(29, result.get(3).score());
        assertEquals("Cùng mùa", result.get(3).reason());

        assertEquals(25, result.get(4).score());
        assertEquals("Cùng màu sắc", result.get(4).reason());

        assertEquals(23, result.get(5).score());
        assertEquals("Có tag tương tự", result.get(5).reason());
    }

    @Test
    void getSimilarCostumes_ShouldFallbackWhenMetadataIsMissing() {
        Category sourceCategory = category(1L, "Anime");
        Category differentCategory = category(2L, "Traditional");

        Costume source = costume(1L, "Source", sourceCategory, null, ItemStatus.AVAILABLE);
        Costume sameCategoryFallback = costume(2L, "Fallback Same Category", sourceCategory, null, ItemStatus.AVAILABLE);
        Costume differentCategoryFallback = costume(3L, "Fallback Different Category", differentCategory, null, ItemStatus.AVAILABLE, ItemStatus.AVAILABLE);

        when(costumeRepository.findByIdWithItems(1L)).thenReturn(Optional.of(source));
        when(costumeRepository.findActiveWithItemsExcludingId(CostumeStatus.ACTIVE, 1L))
                .thenReturn(List.of(differentCategoryFallback, sameCategoryFallback));

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getSimilarCostumes(1L, 4);

        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).costume().id());
        assertEquals(11, result.get(0).score());
        assertEquals("Sản phẩm đang còn sẵn để thuê", result.get(0).reason());

        assertEquals(3L, result.get(1).costume().id());
        assertEquals(2, result.get(1).score());
        assertEquals("Sản phẩm đang còn sẵn để thuê", result.get(1).reason());
    }

    @Test
    void getSimilarCostumes_ShouldRespectLimit() {
        Category category = category(1L, "Anime");
        Costume source = costume(
                1L,
                "Source",
                category,
                metadata("Heroic", "Convention", "Summer", "Red", "anime"),
                ItemStatus.AVAILABLE
        );

        List<Costume> candidates = List.of(
                costume(2L, "Candidate 2", category, metadata("Heroic", "Convention", "Summer", "Red", "anime"), ItemStatus.AVAILABLE),
                costume(3L, "Candidate 3", category, metadata("Heroic", "Convention", "Summer", "Blue", "anime"), ItemStatus.AVAILABLE),
                costume(4L, "Candidate 4", category, metadata("Heroic", "Event", "Summer", "Blue", "anime"), ItemStatus.AVAILABLE),
                costume(5L, "Candidate 5", category, metadata("Modern", "Convention", "Summer", "Blue", "anime"), ItemStatus.AVAILABLE),
                costume(6L, "Candidate 6", category, metadata("Modern", "Event", "Winter", "Blue", "anime"), ItemStatus.AVAILABLE)
        );

        when(costumeRepository.findByIdWithItems(1L)).thenReturn(Optional.of(source));
        when(costumeRepository.findActiveWithItemsExcludingId(CostumeStatus.ACTIVE, 1L))
                .thenReturn(candidates);

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getSimilarCostumes(1L, 2);

        assertEquals(2, result.size());
        assertIterableEquals(List.of(2L, 3L), result.stream().map(item -> item.costume().id()).toList());
    }

    @Test
    void getHomepageRecommendations_ShouldRankByAuthenticatedUserHistory() {
        Category anime = category(1L, "Anime");
        User user = user(10L, "customer@aurafit.com");

        Costume viewedCostume = costume(
                1L,
                "Viewed Costume",
                anime,
                metadata("Heroic", "Convention", "Summer", "Red", "anime", "hero"),
                ItemStatus.AVAILABLE
        );
        Costume exactInterest = costume(
                1L,
                "Viewed Costume",
                anime,
                metadata("Heroic", "Convention", "Summer", "Red", "anime", "hero"),
                ItemStatus.AVAILABLE
        );
        Costume strongMetadataMatch = costume(
                2L,
                "Strong Match",
                anime,
                metadata("Heroic", "Convention", "Summer", "Red", "anime", "hero"),
                ItemStatus.AVAILABLE
        );
        Costume weakerMatch = costume(
                3L,
                "Weaker Match",
                anime,
                metadata("Heroic", "Photoshoot", "Winter", "Blue", "anime"),
                ItemStatus.AVAILABLE
        );

        UserInteractionEvent recentViewEvent = interactionEvent(
                100L,
                user,
                "session-auth",
                InteractionEventType.VIEW_PRODUCT,
                InteractionTargetType.COSTUME,
                "1",
                null,
                "{\"style\":\"Heroic\",\"occasion\":\"Convention\",\"season\":\"Summer\",\"category\":\"Anime\",\"color\":\"Red\",\"tags\":[\"anime\",\"hero\"]}",
                LocalDateTime.now()
        );

        when(userRepository.findByEmail("customer@aurafit.com")).thenReturn(Optional.of(user));
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(recentViewEvent));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(weakerMatch, strongMetadataMatch, exactInterest));

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getHomepageRecommendations(
                "customer@aurafit.com",
                null,
                3
        );

        assertIterableEquals(List.of(1L, 2L, 3L), result.stream().map(item -> item.costume().id()).toList());
        assertEquals("Dựa trên sản phẩm bạn đã xem gần đây", result.get(0).reason());
        assertEquals("Dựa trên phong cách bạn quan tâm", result.get(1).reason());
        assertTrue(result.get(0).score() > result.get(1).score());
        assertTrue(result.get(1).score() > result.get(2).score());
    }

    @Test
    void getHomepageRecommendations_ShouldFallbackToSessionForGuestUsers() {
        Category events = category(2L, "Events");

        Costume candidateFromSession = costume(
                11L,
                "Session Match",
                events,
                metadata("Elegant", "Gala", "Winter", "Black", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume weakerCandidate = costume(
                12L,
                "Weaker Session Match",
                events,
                metadata("Elegant", "Photoshoot", "Summer", "White", "portrait"),
                ItemStatus.AVAILABLE
        );

        UserInteractionEvent sessionSearchEvent = interactionEvent(
                101L,
                null,
                "guest-session",
                InteractionEventType.SEARCH,
                InteractionTargetType.SEARCH,
                null,
                "black gala elegant",
                null,
                LocalDateTime.now()
        );

        when(userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc("guest-session"))
                .thenReturn(List.of(sessionSearchEvent));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(weakerCandidate, candidateFromSession));

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getHomepageRecommendations(
                null,
                "guest-session",
                2
        );

        assertEquals(2, result.size());
        assertEquals(11L, result.get(0).costume().id());
        assertEquals("Liên quan tới từ khóa bạn đã tìm", result.get(0).reason());
        assertTrue(result.get(0).score() > result.get(1).score());
    }

    @Test
    void getHomepageRecommendations_ShouldFallbackToPopularAvailableCostumesWhenNoHistory() {
        Category cosplay = category(3L, "Cosplay");

        Costume mostAvailable = costume(
                21L,
                "Most Available",
                cosplay,
                metadata("Playful", "Convention", "Spring", "Blue", "anime"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        Costume mediumAvailable = costume(
                22L,
                "Medium Available",
                cosplay,
                metadata("Playful", "Convention", "Spring", "Pink", "anime"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        Costume unavailable = costume(
                23L,
                "Unavailable",
                cosplay,
                metadata("Playful", "Convention", "Spring", "Red", "anime"),
                ItemStatus.RENTED
        );

        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(unavailable, mediumAvailable, mostAvailable));
        when(userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc("new-guest"))
                .thenReturn(List.of());

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getHomepageRecommendations(
                null,
                "new-guest",
                3
        );

        assertIterableEquals(List.of(21L, 22L), result.stream().map(item -> item.costume().id()).toList());
        assertTrue(result.stream().allMatch(item -> "Gợi ý phổ biến đang còn sẵn để thuê".equals(item.reason())));
    }

    @Test
    void getHomepageRecommendations_ShouldParseLegacyAndNewMetadataKeys() {
        Category events = category(5L, "Events");

        Costume tagMatch = costume(
                41L,
                "Formal Event Match",
                events,
                metadata("Elegant", "Gala", "Winter", "Black", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume weakerCandidate = costume(
                42L,
                "Portrait Event Candidate",
                events,
                metadata("Elegant", "Gala", "Winter", "Black", "portrait"),
                ItemStatus.AVAILABLE
        );

        UserInteractionEvent legacyEvent = interactionEvent(
                201L,
                null,
                "guest-metadata",
                InteractionEventType.SEARCH,
                InteractionTargetType.SEARCH,
                null,
                null,
                "{\"category\":\"Events\",\"tags\":[\"formal\"]}",
                LocalDateTime.now()
        );
        UserInteractionEvent newKeyEvent = interactionEvent(
                202L,
                null,
                "guest-metadata",
                InteractionEventType.SEARCH,
                InteractionTargetType.SEARCH,
                null,
                null,
                "{\"categoryName\":\"Events\",\"categoryPath\":\"su-kien/dam-da-hoi\",\"subcategory\":\"Dam da hoi\",\"tag\":\"formal\"}",
                LocalDateTime.now()
        );

        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(weakerCandidate, tagMatch));
        when(userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc("guest-metadata"))
                .thenReturn(List.of(legacyEvent))
                .thenReturn(List.of(newKeyEvent));

        List<SimilarCostumeRecommendationDTO> legacyResult = recommendationService.getHomepageRecommendations(
                null,
                "guest-metadata",
                2
        );
        List<SimilarCostumeRecommendationDTO> newKeyResult = recommendationService.getHomepageRecommendations(
                null,
                "guest-metadata",
                2
        );

        assertEquals(41L, legacyResult.get(0).costume().id());
        assertEquals(41L, newKeyResult.get(0).costume().id());
    }

    @Test
    void getHomepageRecommendations_ShouldRespectLimit() {
        Category category = category(4L, "Yearbook");
        User user = user(20L, "limit-user@aurafit.com");

        Costume source = costume(
                31L,
                "Source",
                category,
                metadata("Classic", "Yearbook", "Spring", "White", "portrait"),
                ItemStatus.AVAILABLE
        );
        Costume candidate2 = costume(32L, "Candidate 2", category, metadata("Classic", "Yearbook", "Spring", "White", "portrait"), ItemStatus.AVAILABLE);
        Costume candidate3 = costume(33L, "Candidate 3", category, metadata("Classic", "Yearbook", "Spring", "Blue", "portrait"), ItemStatus.AVAILABLE);
        Costume candidate4 = costume(34L, "Candidate 4", category, metadata("Classic", "Photoshoot", "Spring", "Blue", "portrait"), ItemStatus.AVAILABLE);

        UserInteractionEvent viewEvent = interactionEvent(
                102L,
                user,
                "session-limit",
                InteractionEventType.VIEW_PRODUCT,
                InteractionTargetType.COSTUME,
                "31",
                null,
                "{\"style\":\"Classic\",\"occasion\":\"Yearbook\",\"season\":\"Spring\",\"category\":\"Yearbook\",\"color\":\"White\",\"tags\":[\"portrait\"]}",
                LocalDateTime.now()
        );

        when(userRepository.findByEmail("limit-user@aurafit.com")).thenReturn(Optional.of(user));
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(20L))
                .thenReturn(List.of(viewEvent));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(candidate4, candidate3, candidate2, source));

        List<SimilarCostumeRecommendationDTO> result = recommendationService.getHomepageRecommendations(
                "limit-user@aurafit.com",
                null,
                2
        );

        assertEquals(2, result.size());
        assertIterableEquals(List.of(31L, 32L), result.stream().map(item -> item.costume().id()).toList());
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
        user.setFullName("Test User");
        user.setPasswordHash("hash");
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
                .rentalPrice(BigDecimal.valueOf(100_000))
                .depositPrice(BigDecimal.valueOf(200_000))
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
}
