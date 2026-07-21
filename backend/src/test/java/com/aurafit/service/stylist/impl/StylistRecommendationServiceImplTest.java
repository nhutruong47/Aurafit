package com.aurafit.service.stylist.impl;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.dto.response.ChatMessageResponse;
import com.aurafit.entity.Category;
import com.aurafit.entity.ChatMessage;
import com.aurafit.entity.ChatSession;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.ProductEmbedding;
import com.aurafit.entity.User;
import com.aurafit.enums.AiCallType;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.enums.AiErrorType;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.ProductEmbeddingStatus;
import com.aurafit.exception.AiProviderException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.ChatSessionRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.ProductAiMetadataRepository;
import com.aurafit.repository.ProductEmbeddingRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.stylist.StylistIntentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
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
    private ProductAiMetadataRepository productAiMetadataRepository;
    @Mock
    private ProductEmbeddingRepository productEmbeddingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StylistIntentService stylistIntentService;
    @Mock
    private MetadataTagResolver metadataTagResolver;
    @Mock
    private StylistCategoryResolver stylistCategoryResolver;
    @Mock
    private GeminiClient geminiClient;

    private StylistRecommendationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new StylistRecommendationServiceImpl(
                chatSessionRepository,
                chatMessageRepository,
                costumeRepository,
                productAiMetadataRepository,
                productEmbeddingRepository,
                userRepository,
                stylistIntentService,
                metadataTagResolver,
                stylistCategoryResolver,
                geminiClient,
                new ObjectMapper(),
                "text-embedding-test"
        );
        lenient().when(metadataTagResolver.resolve(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(stylistCategoryResolver.resolve(any(), any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @SuppressWarnings("unchecked")
    void handleUserMessage_shouldNormalizeMetadataImmediatelyAfterIntentExtraction() {
        ChatSession session = ChatSession.builder().id(8L).sessionId("session-metadata-resolver").build();
        StylistFilterCriteria rawIntent = new StylistFilterCriteria(
                null, null, null, null, "đỏ tươi", null, null, null, null
        );
        StylistFilterCriteria normalizedIntent = new StylistFilterCriteria(
                null, null, null, null, "đỏ", null, null, null, null
        );
        stubActiveSession(session);
        when(stylistIntentService.extractIntent(any(), any())).thenReturn(rawIntent);
        when(metadataTagResolver.resolve(rawIntent)).thenReturn(normalizedIntent);
        when(stylistCategoryResolver.resolve(normalizedIntent, "tìm váy đỏ tươi"))
                .thenReturn(normalizedIntent);
        when(costumeRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        service.handleUserMessage("session-metadata-resolver", null, "tìm váy đỏ tươi");

        InOrder resolverOrder = inOrder(stylistIntentService, metadataTagResolver, stylistCategoryResolver);
        resolverOrder.verify(stylistIntentService).extractIntent(eq("tìm váy đỏ tươi"), any());
        resolverOrder.verify(metadataTagResolver).resolve(rawIntent);
        resolverOrder.verify(stylistCategoryResolver).resolve(normalizedIntent, "tìm váy đỏ tươi");
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

    @Test
    void handleUserMessage_shouldAttachAuthenticatedUserToAnonymousSession() {
        ChatSession session = ChatSession.builder().id(4L).sessionId("anonymous-session").build();
        User user = user(20L, "user@aurafit.com");
        when(userRepository.findById(20L)).thenReturn(Optional.of(user));
        when(chatSessionRepository.findBySessionId("anonymous-session"))
                .thenReturn(Optional.of(session));
        when(chatSessionRepository.save(session)).thenReturn(session);
        when(chatMessageRepository
                .countByChatSessionAndRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        eq(session),
                        eq(ChatMessageRole.USER),
                        any(LocalDateTime.class),
                        any(LocalDateTime.class)
                ))
                .thenReturn(20L);

        service.handleUserMessage("anonymous-session", 20L, "Tư vấn cho tôi");

        assertEquals(20L, session.getUser().getId());
        verify(chatSessionRepository).save(session);
    }

    @Test
    void handleUserMessage_shouldRejectSessionOwnedByAnotherUser() {
        User owner = user(30L, "owner@aurafit.com");
        User requester = user(31L, "requester@aurafit.com");
        ChatSession session = ChatSession.builder()
                .id(5L)
                .sessionId("owned-session")
                .user(owner)
                .build();
        when(userRepository.findById(31L)).thenReturn(Optional.of(requester));
        when(chatSessionRepository.findBySessionId("owned-session"))
                .thenReturn(Optional.of(session));

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.handleUserMessage("owned-session", 31L, "Tư vấn cho tôi")
        );

        verifyNoInteractions(chatMessageRepository, stylistIntentService, geminiClient, costumeRepository);
    }

    @Test
    @SuppressWarnings("unchecked")
    void handleUserMessage_shouldUseLegacyFallbackWhenProductEmbeddingsAreEmpty() {
        ChatSession session = ChatSession.builder().id(6L).sessionId("session-relaxed").build();
        StylistFilterCriteria extractedCriteria = new StylistFilterCriteria(
                "su-kien",
                null,
                "dạ hội",
                null,
                null,
                null,
                null,
                null,
                null
        );
        StylistFilterCriteria resolvedCriteria = new StylistFilterCriteria(
                "su-kien/da-hoi",
                null,
                "dạ hội",
                null,
                null,
                null,
                null,
                null,
                null
        );
        Costume costume = costume(15L, "Váy dạ hội đỏ ruby", "Đỏ ruby", "Gala", "váy dạ hội");

        stubActiveSession(session);
        when(stylistIntentService.extractIntent(any(), any())).thenReturn(extractedCriteria);
        when(stylistCategoryResolver.resolve(extractedCriteria, "tôi muốn đi dạ hội"))
                .thenReturn(resolvedCriteria);
        when(productEmbeddingRepository.findAllByEligibleCostume(CostumeStatus.ACTIVE, ItemStatus.AVAILABLE))
                .thenReturn(List.of());
        when(costumeRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty(), new PageImpl<>(List.of(costume)));
        when(geminiClient.generateText(eq(AiCallType.RESPONSE_GENERATION), any(), any()))
                .thenReturn("Mẫu váy này phù hợp với buổi dạ hội.\nRECOMMENDED_IDS: 15");
        when(costumeRepository.findByIdWithItems(15L)).thenReturn(Optional.of(costume));

        ChatMessageResponse response = service.handleUserMessage(
                "session-relaxed",
                null,
                "tôi muốn đi dạ hội"
        );

        assertEquals(false, response.hasError());
        assertEquals(List.of(15L), response.recommendedCostumes().stream().map(item -> item.id()).toList());
        verify(costumeRepository, times(2)).findAll(any(Specification.class), any(Pageable.class));
        verify(geminiClient, never()).embedText(any(), any());

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient).generateText(
                eq(AiCallType.RESPONSE_GENERATION),
                any(),
                promptCaptor.capture()
        );
        assertTrue(promptCaptor.getValue().contains("Style tags: Dạ hội sang trọng"));
        assertTrue(promptCaptor.getValue().contains("Color tags: Đỏ ruby"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void handleUserMessage_shouldKeepStrictCandidatesWithoutLoadingEmbeddings() {
        ChatSession session = ChatSession.builder().id(10L).sessionId("session-strict").build();
        StylistFilterCriteria criteria = new StylistFilterCriteria(
                null, null, "dạ hội", null, "đỏ", null, null, null, null
        );
        Costume strictCostume = costume(18L, "Váy đỏ dạ hội", "Đỏ", "Dạ hội", "sang trọng");
        strictCostume.setDescription("A".repeat(200));
        ProductAiMetadata enrichedMetadata = ProductAiMetadata.builder()
                .costumeId(18L)
                .styleTags(List.of("thanh lịch", "elegant", "sang trọng", "tối giản", "không được hiển thị"))
                .occasionTags(List.of("dạ tiệc", "gala"))
                .seasonTags(List.of("quanh năm"))
                .colorTags(List.of("đỏ", "red", "đỏ tươi"))
                .genderTags(List.of("nữ", "women"))
                .sizeTags(List.of("m", "medium"))
                .materialTags(List.of("lụa", "silk"))
                .fitTags(List.of("ôm dáng", "fitted"))
                .trendTags(List.of("quiet luxury"))
                .build();

        stubActiveSession(session);
        ChatMessage previousUser = message(90L, session, ChatMessageRole.USER, "Tôi cần váy dự tiệc");
        ChatMessage previousAssistant = message(91L, session, ChatMessageRole.ASSISTANT, "Tôi đã chọn một số mẫu váy phù hợp.");
        previousAssistant.setRecommendedCostumeIds("17,18");
        when(chatMessageRepository.findByChatSessionOrderByCreatedAtDesc(eq(session), any(Pageable.class)))
                .thenReturn(List.of(previousAssistant, previousUser));
        when(stylistIntentService.extractIntent(any(), any())).thenReturn(criteria);
        when(costumeRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(strictCostume)));
        when(productAiMetadataRepository.findAllByCostumeIdIn(List.of(18L)))
                .thenReturn(List.of(enrichedMetadata));
        when(geminiClient.generateText(eq(AiCallType.RESPONSE_GENERATION), any(), any()))
                .thenReturn("Mẫu váy phù hợp.\nRECOMMENDED_IDS: 18");
        when(costumeRepository.findByIdWithItems(18L)).thenReturn(Optional.of(strictCostume));

        ChatMessageResponse response = service.handleUserMessage(
                "session-strict",
                null,
                "tìm váy đỏ dạ hội"
        );

        assertEquals(List.of(18L), response.recommendedCostumes().stream().map(item -> item.id()).toList());
        verifyNoInteractions(productEmbeddingRepository);
        verify(geminiClient, never()).embedText(any(), any());
        verify(costumeRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient).generateText(
                eq(AiCallType.RESPONSE_GENERATION),
                any(),
                promptCaptor.capture()
        );
        String prompt = promptCaptor.getValue();
        assertTrue(prompt.contains("Mô tả: " + "A".repeat(147) + "..."));
        assertTrue(prompt.contains("Style tags: thanh lịch, elegant, sang trọng, tối giản"));
        assertTrue(prompt.contains("Occasion tags: dạ tiệc, gala"));
        assertTrue(prompt.contains("Color tags: đỏ, red, đỏ tươi"));
        assertTrue(prompt.contains("Material tags: lụa, silk"));
        assertTrue(prompt.contains("Fit tags: ôm dáng, fitted"));
        assertTrue(prompt.contains("Trend tags: quiet luxury"));
        assertTrue(prompt.contains("Khách hàng: Tôi cần váy dự tiệc"));
        assertTrue(prompt.contains("Stylist: Tôi đã chọn một số mẫu váy phù hợp. [ID sản phẩm đã gợi ý: 17,18]"));
        assertTrue(prompt.contains("Yêu cầu hiện tại của khách hàng: tìm váy đỏ dạ hội"));
        assertEquals(false, prompt.contains("không được hiển thị"));
        assertEquals(false, prompt.contains("Style tags: Dạ hội sang trọng"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void handleUserMessage_shouldRankFallbackCandidatesByEmbeddingWithOneEmbeddingCall() {
        ChatSession session = ChatSession.builder().id(9L).sessionId("session-embedding").build();
        StylistFilterCriteria criteria = new StylistFilterCriteria(
                "su-kien/da-hoi",
                "thanh lịch",
                "dạ hội",
                null,
                "đỏ",
                "nữ",
                List.of("sang trọng"),
                null,
                BigDecimal.valueOf(600_000)
        );
        Costume closest = costume(15L, "Váy đỏ", "Đỏ", "Dạ hội", "sang trọng");
        Costume inactiveCategory = costume(16L, "Váy xanh", "Xanh", "Dạ hội", "thanh lịch");
        inactiveCategory.getCategory().setIsActive(false);
        Costume unavailable = costume(18L, "Váy tím", "Tím", "Dạ hội", "nổi bật");
        unavailable.setAvailableItemCount(0);
        List<ProductEmbedding> embeddings = List.of(
                embedding(15L, ProductEmbeddingStatus.READY, "[0.9,0.1]"),
                embedding(16L, ProductEmbeddingStatus.READY, "[0.0,1.0]"),
                embedding(18L, ProductEmbeddingStatus.READY, "[0.8,0.2]"),
                embedding(17L, ProductEmbeddingStatus.FAILED, "[]")
        );

        stubActiveSession(session);
        when(stylistIntentService.extractIntent(any(), any())).thenReturn(criteria);
        when(productEmbeddingRepository.findAllByEligibleCostume(CostumeStatus.ACTIVE, ItemStatus.AVAILABLE))
                .thenReturn(embeddings);
        when(costumeRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(geminiClient.embedText(eq("text-embedding-test"), any()))
                .thenReturn(new GeminiClient.EmbeddingResult(
                        "text-embedding-test",
                        List.of(1.0f, 0.0f)
                ));
        when(costumeRepository.findAllByIdWithMetadata(List.of(15L, 18L, 16L)))
                .thenReturn(List.of(inactiveCategory, unavailable, closest));
        when(geminiClient.generateText(eq(AiCallType.RESPONSE_GENERATION), any(), any()))
                .thenReturn("Mẫu váy đỏ phù hợp nhất.\nRECOMMENDED_IDS: 15");
        when(costumeRepository.findByIdWithItems(15L)).thenReturn(Optional.of(closest));

        ChatMessageResponse response = service.handleUserMessage(
                "session-embedding",
                null,
                "tìm váy đỏ đi dạ hội"
        );

        assertEquals(List.of(15L), response.recommendedCostumes().stream().map(item -> item.id()).toList());
        verify(geminiClient, times(1)).embedText(eq("text-embedding-test"), any());
        verify(costumeRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));

        ArgumentCaptor<String> queryCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient).embedText(eq("text-embedding-test"), queryCaptor.capture());
        assertTrue(queryCaptor.getValue().contains("Yêu cầu khách hàng: tìm váy đỏ đi dạ hội"));
        assertTrue(queryCaptor.getValue().contains("Danh mục: su-kien/da-hoi"));
        assertTrue(queryCaptor.getValue().contains("Dịp sử dụng: dạ hội"));

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient).generateText(
                eq(AiCallType.RESPONSE_GENERATION),
                any(),
                promptCaptor.capture()
        );
        assertTrue(promptCaptor.getValue().contains("ID: 15"));
        assertEquals(false, promptCaptor.getValue().contains("ID: 16"));
        assertEquals(false, promptCaptor.getValue().contains("ID: 18"));
    }

    @Test
    void handleUserMessage_shouldSendRecentUserAndAssistantMessagesAsIntentHistory() {
        ChatSession session = ChatSession.builder().id(7L).sessionId("session-history").build();
        ChatMessage newestAssistantError = message(40L, session, ChatMessageRole.ASSISTANT, "Không tìm thấy");
        ChatMessage newestUser = message(39L, session, ChatMessageRole.USER, "Tìm đồ Noel");
        ChatMessage olderAssistant = message(38L, session, ChatMessageRole.ASSISTANT, "Gợi ý Noel");
        ChatMessage olderUser = message(37L, session, ChatMessageRole.USER, "Tìm đồ lễ hội");

        when(chatSessionRepository.findBySessionId("session-history")).thenReturn(Optional.of(session));
        when(chatMessageRepository
                .countByChatSessionAndRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        eq(session),
                        eq(ChatMessageRole.USER),
                        any(LocalDateTime.class),
                        any(LocalDateTime.class)
                ))
                .thenReturn(2L);
        when(chatMessageRepository.findFirstByChatSessionAndRoleOrderByCreatedAtDesc(
                session,
                ChatMessageRole.USER
        )).thenReturn(Optional.of(newestUser));
        when(chatMessageRepository.findByChatSessionOrderByCreatedAtDesc(eq(session), any(Pageable.class)))
                .thenReturn(List.of(newestAssistantError, newestUser, olderAssistant, olderUser));
        when(chatMessageRepository.save(any(ChatMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(stylistIntentService.extractIntent(any(), any())).thenReturn(StylistFilterCriteria.empty());
        when(costumeRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        service.handleUserMessage("session-history", null, "có vest đen không");

        @SuppressWarnings("rawtypes")
        ArgumentCaptor<List> historyCaptor = ArgumentCaptor.forClass(List.class);
        verify(stylistIntentService).extractIntent(eq("có vest đen không"), historyCaptor.capture());
        @SuppressWarnings("unchecked")
        List<ChatMessage> capturedHistory = historyCaptor.getValue();
        assertEquals(
                List.of(37L, 38L, 39L, 40L),
                capturedHistory.stream().map(ChatMessage::getId).toList()
        );
    }

    private void stubActiveSession(ChatSession session) {
        when(chatSessionRepository.findBySessionId(session.getSessionId())).thenReturn(Optional.of(session));
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
        lenient().when(chatMessageRepository.findByChatSessionOrderByCreatedAtDesc(eq(session), any(Pageable.class)))
                .thenReturn(List.of());
        when(chatMessageRepository.save(any(ChatMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Costume costume(Long id, String name, String color, String occasion, String... tags) {
        Category category = Category.builder()
                .id(20L)
                .name("Đầm dạ hội")
                .slug("dam-da-hoi")
                .path("su-kien/da-hoi/dam-da-hoi")
                .isActive(true)
                .build();
        Costume costume = Costume.builder()
                .id(id)
                .name(name)
                .rentalPrice(BigDecimal.valueOf(400_000))
                .depositPrice(BigDecimal.valueOf(1_000_000))
                .status(com.aurafit.enums.CostumeStatus.ACTIVE)
                .category(category)
                .availableItemCount(1)
                .build();
        CostumeMetadata metadata = CostumeMetadata.builder()
                .costume(costume)
                .style("Dạ hội sang trọng")
                .occasion(occasion)
                .season("Quanh năm")
                .color(color)
                .tags(List.of(tags))
                .build();
        costume.setMetadata(metadata);
        return costume;
    }

    private ProductEmbedding embedding(
            Long costumeId,
            ProductEmbeddingStatus status,
            String payload
    ) {
        int dimension = status == ProductEmbeddingStatus.READY ? 2 : 0;
        return ProductEmbedding.builder()
                .costumeId(costumeId)
                .embeddingDimension(dimension)
                .embeddingModel("text-embedding-test")
                .embeddingPayload(payload)
                .status(status)
                .build();
    }

    private ChatMessage message(
            Long id,
            ChatSession session,
            ChatMessageRole role,
            String content
    ) {
        return ChatMessage.builder()
                .id(id)
                .chatSession(session)
                .role(role)
                .content(content)
                .build();
    }

    private User user(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }
}
