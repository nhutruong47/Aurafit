package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.dto.ai.RecommendationReasoningInput;
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
import com.aurafit.service.AiChatContext;
import com.aurafit.service.AiExplanationService;
import com.aurafit.service.AiIntentUnderstandingService;
import com.aurafit.service.AiProviderClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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

    @Mock
    private AiIntentUnderstandingService aiIntentUnderstandingService;

    @Mock
    private AiProviderClient aiProviderClient;

    private ObjectMapper objectMapper;
    private AiProviderProperties aiProviderProperties;
    private AiStylistServiceImpl aiStylistService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        aiProviderProperties = new AiProviderProperties();
        aiProviderProperties.setEnabled(false);
        aiProviderProperties.setChatModel("gemini-test");
        aiProviderProperties.setProviderBaseUrl("https://provider.example");
        aiProviderProperties.setProviderApiKey("secret");

        aiStylistService = new AiStylistServiceImpl(
                aiStylistSessionRepository,
                costumeRepository,
                rentalOrderDetailRepository,
                userInteractionEventRepository,
                userRepository,
                objectMapper,
                aiProviderProperties,
                aiExplanationService,
                aiIntentUnderstandingService,
                new RecommendationReasoningServiceImpl(aiProviderProperties, aiProviderClient, objectMapper),
                new AiChatContextBuilderImpl(objectMapper)
        );
        lenient().when(userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(List.of());
        lenient().when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(anyLong()))
                .thenReturn(List.of());
        lenient().when(aiExplanationService.enhanceRecommendationReasons(anyString(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .thenAnswer(invocation -> invocation.getArgument(5));
        lenient().when(aiExplanationService.enhanceRecommendationReasons(anyString(), anyString(), anyString(), anyString(), anyString(), anyList(), any(AiChatContext.class)))
                .thenAnswer(invocation -> invocation.getArgument(5));
        lenient().when(aiIntentUnderstandingService.understandIntent(any(AiChatContext.class)))
                .thenAnswer(invocation -> detectIntentFromContext(invocation.getArgument(0)));
        lenient().when(aiIntentUnderstandingService.understandIntent(anyString()))
                .thenAnswer(invocation -> detectIntent(invocation.getArgument(0)));
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
        assertTrue(result.messages().get(0).content().contains("AI Stylist đã sẵn sàng"));
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
                                .content("AI Stylist đã sẵn sàng.")
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
        assertTrue(result.messages().get(2).content().contains("Mình đã đối chiếu"));
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
                                .content("AI Stylist đã sẵn sàng.")
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
        assertTrue(result.messages().get(2).content().contains("2026-07-10 đến 2026-07-12"));
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
    void sendMessage_ShouldUseLlmReasoningRecommendationsWhenFlagEnabled() throws Exception {
        aiProviderProperties.setEnabled(true);
        aiProviderProperties.setReasoningRankingEnabled(true);

        Category events = category(31L, "Events");
        Costume selectedCostume = costume(
                31L,
                "Black Gala Dress",
                events,
                metadataWithFit("Elegant", "Gala", "Winter", "Black", "neutral", "hourglass", "satin", "ôm eo nhẹ", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume llmTopPick = costume(
                32L,
                "Midnight Satin Gown",
                events,
                metadataWithFit("Elegant", "Gala", "Winter", "Black", "neutral", "hourglass", "satin", "tôn eo và vai", "formal"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        Costume secondPick = costume(
                33L,
                "Silver Evening Dress",
                events,
                metadataWithFit("Elegant", "Gala", "Winter", "Silver", "cool", "slim", "organza", "phom suông", "formal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(31L)
                .guestSessionId("guest-llm")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist đã sẵn sàng.")
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(31L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(secondPick, llmTopPick, selectedCostume));
        when(aiProviderClient.reasonRecommendations(any())).thenReturn("""
                {
                  "recommendations": [
                    {
                      "costumeId": "32",
                      "reasoning": "Mẫu này đúng vibe tiệc tối sang trọng và chất satin hợp yêu cầu thanh lịch. Fit note cũng tôn phần eo rõ hơn.",
                      "confidenceScore": 0.93,
                      "matchedAttributes": ["style: elegant", "occasion: gala", "material: satin", "bodyType: hourglass"]
                    },
                    {
                      "costumeId": "33",
                      "reasoning": "Đây là phương án thay thế sáng hơn nhưng vẫn hợp tiệc tối. Phom suông dễ mặc nếu muốn cảm giác nhẹ hơn.",
                      "confidenceScore": 0.71,
                      "matchedAttributes": ["style: elegant", "occasion: gala", "color: silver"]
                    }
                  ],
                  "clarificationNeeded": null,
                  "noMatchReason": null
                }
                """);
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 80L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(31L, "guest-llm", 31L, null, null, "Gợi ý cho mình đồ đi gala sang trọng"),
                null
        );

        assertEquals(32L, result.messages().get(2).recommendations().get(0).costume().id());
        assertTrue(result.messages().get(2).recommendations().get(0).reason().contains("satin"));
        assertEquals(2, result.messages().get(2).recommendations().size());

        ArgumentCaptor<AiProviderClient.RecommendationReasoningPrompt> promptCaptor =
                ArgumentCaptor.forClass(AiProviderClient.RecommendationReasoningPrompt.class);
        verify(aiProviderClient).reasonRecommendations(promptCaptor.capture());
        RecommendationReasoningInput sentInput = promptCaptor.getValue().input();
        assertNotNull(sentInput);
        assertFalse(sentInput.candidatePool().isEmpty());
        RecommendationReasoningInput.CandidateCostume capturedCandidate = sentInput.candidatePool().stream()
                .filter(item -> "32".equals(item.id()))
                .findFirst()
                .orElseThrow();
        assertEquals("neutral", capturedCandidate.skinTone());
        assertEquals("hourglass", capturedCandidate.bodyType());
        assertEquals("satin", capturedCandidate.material());
        assertEquals("tôn eo và vai", capturedCandidate.fitNote());

        Map<String, Object> metadata = readAssistantMetadata(session);
        assertEquals("llm", metadata.get("reasoningRankingMode"));
        assertEquals(Boolean.TRUE, metadata.get("llmReasoningUsed"));
        assertNotNull(metadata.get("llmReasoningOutput"));
    }

    @Test
    void sendMessage_ShouldReturnClarificationWhenLlmRequestsMoreInfo() throws Exception {
        aiProviderProperties.setEnabled(true);
        aiProviderProperties.setReasoningRankingEnabled(true);

        Category events = category(41L, "Events");
        Costume candidate = costume(
                41L,
                "Evening Dress",
                events,
                metadataWithFit("Elegant", "Gala", "Winter", "Black", "neutral", "hourglass", "satin", "ôm nhẹ", "formal"),
                ItemStatus.AVAILABLE
        );
        AiStylistSession session = AiStylistSession.builder()
                .id(41L)
                .guestSessionId("guest-clarify")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.ASSISTANT).content("AI Stylist đã sẵn sàng.").build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(41L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE)).thenReturn(List.of(candidate));
        when(aiProviderClient.reasonRecommendations(any())).thenReturn("""
                {
                  "recommendations": [],
                  "clarificationNeeded": "Bạn muốn mặc cho dịp nào và ưu tiên màu gì để mình lọc chính xác hơn?",
                  "noMatchReason": null
                }
                """);
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 90L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(41L, "guest-clarify", null, null, null, "Gợi ý đồ đẹp cho mình"),
                null
        );

        assertEquals("Bạn muốn mặc cho dịp nào và ưu tiên màu gì để mình lọc chính xác hơn?", result.messages().get(2).content());
        assertTrue(result.messages().get(2).recommendations().isEmpty());

        Map<String, Object> metadata = readAssistantMetadata(session);
        assertEquals(Boolean.TRUE, metadata.get("awaitingClarification"));
        assertEquals("Bạn muốn mặc cho dịp nào và ưu tiên màu gì để mình lọc chính xác hơn?", metadata.get("clarificationNeeded"));
    }

    @Test
    void sendMessage_ShouldReturnNoMatchReasonWhenLlmFindsNoSuitableCandidate() throws Exception {
        aiProviderProperties.setEnabled(true);
        aiProviderProperties.setReasoningRankingEnabled(true);

        Category traditional = category(51L, "Traditional");
        Costume candidate = costume(
                51L,
                "Áo dài đỏ",
                traditional,
                metadataWithFit("Traditional", "Traditional", "Spring", "Red", "warm", "slim", "lụa", "phom ôm nhẹ", "ao dai"),
                ItemStatus.AVAILABLE
        );
        AiStylistSession session = AiStylistSession.builder()
                .id(51L)
                .guestSessionId("guest-no-match")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.ASSISTANT).content("AI Stylist đã sẵn sàng.").build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(51L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE)).thenReturn(List.of(candidate));
        when(aiProviderClient.reasonRecommendations(any())).thenReturn("""
                {
                  "recommendations": [],
                  "clarificationNeeded": null,
                  "noMatchReason": "Hiện pool còn lại chưa có mẫu nào đúng phong cách vest công sở mà bạn đang cần."
                }
                """);
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 100L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(51L, "guest-no-match", null, null, null, "Gợi ý cho mình vest công sở tối màu"),
                null
        );

        assertEquals("Hiện pool còn lại chưa có mẫu nào đúng phong cách vest công sở mà bạn đang cần.", result.messages().get(2).content());
        assertTrue(result.messages().get(2).recommendations().isEmpty());

        Map<String, Object> metadata = readAssistantMetadata(session);
        assertEquals("Hiện pool còn lại chưa có mẫu nào đúng phong cách vest công sở mà bạn đang cần.", metadata.get("noMatchReason"));
        assertEquals("llm", metadata.get("reasoningRankingMode"));
    }

    @Test
    void sendMessage_ShouldFallbackToRuleBasedWhenLlmReasoningFails() throws Exception {
        aiProviderProperties.setEnabled(true);
        aiProviderProperties.setReasoningRankingEnabled(true);

        Category events = category(61L, "Events");
        Costume selectedCostume = costume(
                61L,
                "Red Gala Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume availableCandidate = costume(
                62L,
                "Velvet Red Evening Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume blockedCandidate = costume(
                63L,
                "Ruby Event Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(61L)
                .guestSessionId("guest-fallback")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.ASSISTANT).content("AI Stylist đã sẵn sàng.").build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(61L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(blockedCandidate, availableCandidate, selectedCostume));
        when(rentalOrderDetailRepository.findBookedCostumeItemIdsForPeriod(anyCollection(), any(), any(), any()))
                .thenReturn(List.of(631L));
        when(aiProviderClient.reasonRecommendations(any())).thenThrow(new IllegalStateException("AI provider request timed out."));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 110L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(
                        61L,
                        "guest-fallback",
                        61L,
                        LocalDate.of(2026, 7, 10),
                        LocalDate.of(2026, 7, 12),
                        "Can goi y bo tuong tu mau do"
                ),
                null
        );

        assertTrue(result.messages().get(2).content().contains("2026-07-10"));
        assertTrue(result.messages().get(2).recommendations().stream().noneMatch(item -> item.costume().id().equals(63L)));
        assertTrue(result.messages().get(2).recommendations().stream().anyMatch(item -> item.costume().id().equals(62L)));

        Map<String, Object> metadata = readAssistantMetadata(session);
        assertEquals(Boolean.TRUE, metadata.get("fallback"));
        assertEquals("rule_based_fallback", metadata.get("reasoningRankingMode"));
        assertNotNull(metadata.get("reasoningCorrelationId"));
    }

    @Test
    void sendMessage_ShouldKeepRuleBasedBehaviorWhenReasoningFlagIsDisabled() throws Exception {
        aiProviderProperties.setEnabled(true);
        aiProviderProperties.setReasoningRankingEnabled(false);

        Category events = category(71L, "Events");
        Costume selectedCostume = costume(
                71L,
                "Red Gala Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume availableCandidate = costume(
                72L,
                "Velvet Red Evening Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume blockedCandidate = costume(
                73L,
                "Ruby Event Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(71L)
                .guestSessionId("guest-flag-off")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.ASSISTANT).content("AI Stylist đã sẵn sàng.").build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(71L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(blockedCandidate, availableCandidate, selectedCostume));
        when(rentalOrderDetailRepository.findBookedCostumeItemIdsForPeriod(anyCollection(), any(), any(), any()))
                .thenReturn(List.of(731L));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 120L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(
                        71L,
                        "guest-flag-off",
                        71L,
                        LocalDate.of(2026, 7, 10),
                        LocalDate.of(2026, 7, 12),
                        "Can goi y bo tuong tu mau do"
                ),
                null
        );

        assertTrue(result.messages().get(2).content().contains("2026-07-10"));
        assertTrue(result.messages().get(2).recommendations().stream().noneMatch(item -> item.costume().id().equals(73L)));
        assertTrue(result.messages().get(2).recommendations().stream().anyMatch(item -> item.costume().id().equals(72L)));
        verify(aiProviderClient, never()).reasonRecommendations(any());

        Map<String, Object> metadata = readAssistantMetadata(session);
        assertFalse(metadata.containsKey("fallback"));
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
                                .content("AI Stylist đã sẵn sàng.")
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
        assertTrue(result.messages().get(2).content().contains("chỉ dùng thêm hành vi bạn đã xem và tìm gần đây"));
        assertTrue(result.messages().get(2).recommendations().get(0).reason().contains("Gần với costume bạn đã xem"));
    }

    @Test
    void sendMessage_ShouldUseParsedRentalDateWhenPayloadDatesAreMissing() {
        Category events = category(19L, "Events");
        Costume selectedCostume = costume(
                19L,
                "Red Gala Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume availableCandidate = costume(
                20L,
                "Velvet Red Evening Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume blockedCandidate = costume(
                21L,
                "Ruby Event Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Red", "formal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(19L)
                .guestSessionId("guest-date-chat")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist Ä‘Ã£ sáºµn sÃ ng.")
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(19L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(blockedCandidate, availableCandidate, selectedCostume));
        when(rentalOrderDetailRepository.findBookedCostumeItemIdsForPeriod(anyCollection(), any(), any(), any()))
                .thenReturn(List.of(211L));
        when(aiIntentUnderstandingService.understandIntent(any(AiChatContext.class))).thenReturn(
                new AiIntentUnderstandingService.IntentUnderstandingResult(
                        AiIntentUnderstandingService.IntentType.RECOMMENDATION_REQUEST,
                        0.9,
                        AiIntentUnderstandingService.Language.VI,
                        "gala",
                        "formal",
                        "red",
                        null,
                        null,
                        null,
                        "2026-07-15",
                        "current_product",
                        false,
                        false,
                        "{}",
                        false
                )
        );
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 33L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(
                        19L,
                        "guest-date-chat",
                        19L,
                        null,
                        null,
                        "Can goi y bo tuong tu mau do cho ngay 2026-07-15"
                ),
                null
        );

        assertFalse(result.messages().get(2).recommendations().isEmpty());
        assertTrue(
                result.messages().get(2).recommendations().stream()
                        .noneMatch(item -> item.costume().id().equals(21L))
        );
        assertTrue(
                result.messages().get(2).recommendations().stream()
                        .anyMatch(item -> item.costume().id().equals(20L))
        );
        verify(rentalOrderDetailRepository).findBookedCostumeItemIdsForPeriod(anyCollection(), any(), any(), any());
    }

    @Test
    void sendMessage_ShouldPersonalizeRecommendationsFromNewInteractionMetadataKeys() {
        User user = user(22L, "history-new-keys@aurafit.vn");
        Category events = category(22L, "Events");
        Costume metadataMatch = costume(
                22L,
                "Formal Event Match",
                events,
                metadata("Elegant", "Gala", "Winter", "Black", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume weakerCandidate = costume(
                23L,
                "Portrait Event Candidate",
                events,
                metadata("Elegant", "Gala", "Winter", "Black", "portrait"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(22L)
                .user(user)
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist Ä‘Ã£ sáºµn sÃ ng.")
                                .build()
                )))
                .build();

        UserInteractionEvent recentSearchEvent = interactionEvent(
                522L,
                user,
                "session-auth-new",
                InteractionEventType.SEARCH,
                InteractionTargetType.SEARCH,
                null,
                null,
                "{\"categoryName\":\"Events\",\"categoryPath\":\"su-kien/dam-da-hoi\",\"subcategory\":\"Dam da hoi\",\"tag\":\"formal\"}",
                LocalDateTime.now()
        );

        when(userRepository.findByEmail("history-new-keys@aurafit.vn")).thenReturn(Optional.of(user));
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(22L))
                .thenReturn(List.of(recentSearchEvent));
        when(aiStylistSessionRepository.findByIdWithMessages(22L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(weakerCandidate, metadataMatch));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 35L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(22L, null, null, null, null, "Goi y cho minh costume phu hop"),
                "history-new-keys@aurafit.vn"
        );

        assertFalse(result.messages().get(2).recommendations().isEmpty());
        assertEquals(22L, result.messages().get(2).recommendations().get(0).costume().id());
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
                                .content("AI Stylist đã sẵn sàng.")
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
    void sendMessage_ShouldHandleVietnameseCasualChatWithoutRecommendations() {
        User user = user(41L, "casual@aurafit.vn");
        Category cosplay = category(8L, "Cosplay");
        Costume cosplayCandidate = costume(
                15L,
                "Galaxy Hero Cosplay",
                cosplay,
                metadata("Fantasy", "Cosplay", "All Season", "Blue", "anime"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(15L)
                .user(user)
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist đã sẵn sàng.")
                                .build()
                )))
                .build();

        UserInteractionEvent recentViewEvent = interactionEvent(
                801L,
                user,
                "casual-session",
                InteractionEventType.VIEW_PRODUCT,
                InteractionTargetType.COSTUME,
                "15",
                "cosplay anime",
                "{\"style\":\"Fantasy\",\"occasion\":\"Cosplay\",\"season\":\"All Season\",\"category\":\"Cosplay\",\"color\":\"Blue\",\"tags\":[\"anime\"]}",
                LocalDateTime.now()
        );

        when(userRepository.findByEmail("casual@aurafit.vn")).thenReturn(Optional.of(user));
        when(aiStylistSessionRepository.findByIdWithMessages(15L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(cosplayCandidate));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 70L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(15L, null, null, null, null, "Bạn khỏe không?"),
                "casual@aurafit.vn"
        );

        assertTrue(result.messages().get(2).recommendations().isEmpty());
        assertTrue(result.messages().get(2).content().contains("sẵn sàng giúp bạn")
                || result.messages().get(2).content().contains("đang tìm đồ cho dịp nào"));
    }

    @Test
    void sendMessage_ShouldHandleEnglishCasualChatWithoutRecommendations() {
        AiStylistSession session = AiStylistSession.builder()
                .id(16L)
                .guestSessionId("guest-casual-en")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist đã sẵn sàng.")
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(16L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE)).thenReturn(List.of());
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 80L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(16L, "guest-casual-en", null, null, null, "Hello, how are you?"),
                null
        );

        assertTrue(result.messages().get(2).recommendations().isEmpty());
        assertTrue(result.messages().get(2).content().contains("I'm doing well")
                || result.messages().get(2).content().contains("ready to help"));
    }

    @Test
    void sendMessage_ShouldHandleRentalSupportWithoutRecommendations() {
        AiStylistSession session = AiStylistSession.builder()
                .id(17L)
                .guestSessionId("guest-support")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist đã sẵn sàng.")
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(17L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE)).thenReturn(List.of());
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 90L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(17L, "guest-support", null, null, null, "Thuê đồ cần đặt cọc không?"),
                null
        );

        assertTrue(result.messages().get(2).recommendations().isEmpty());
        assertTrue(result.messages().get(2).content().contains("đặt cọc")
                || result.messages().get(2).content().contains("xác nhận lại với shop"));
    }

    @Test
    void sendMessage_ShouldNotLetHistoryOverrideThanksMessage() {
        User user = user(42L, "thanks@aurafit.vn");
        Category events = category(9L, "Events");
        Costume galaCandidate = costume(
                16L,
                "Crystal Gala Dress",
                events,
                metadata("Elegant", "Gala", "Winter", "Silver", "formal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(18L)
                .user(user)
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist đã sẵn sàng.")
                                .build()
                )))
                .build();

        UserInteractionEvent historyEvent = interactionEvent(
                901L,
                user,
                "thanks-session",
                InteractionEventType.VIEW_PRODUCT,
                InteractionTargetType.COSTUME,
                "16",
                "dam da hoi",
                "{\"style\":\"Elegant\",\"occasion\":\"Gala\",\"season\":\"Winter\",\"category\":\"Events\",\"color\":\"Silver\",\"tags\":[\"formal\"]}",
                LocalDateTime.now()
        );

        when(userRepository.findByEmail("thanks@aurafit.vn")).thenReturn(Optional.of(user));
        when(aiStylistSessionRepository.findByIdWithMessages(18L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE)).thenReturn(List.of(galaCandidate));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 100L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(18L, null, null, null, null, "Cảm ơn"),
                "thanks@aurafit.vn"
        );

        assertTrue(result.messages().get(2).recommendations().isEmpty());
        assertTrue(result.messages().get(2).content().contains("Không có gì")
                || result.messages().get(2).content().contains("sẵn sàng giúp bạn"));
    }

    @Test
    void sendMessage_ShouldReplyInEnglishWhenUserMessageIsEnglish() {
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
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(12L)
                .guestSessionId("guest-en")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist đã sẵn sàng.")
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(12L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(matchingCandidate, selectedCostume));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 45L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(12L, "guest-en", 1L, null, null, "Can you recommend a red costume under 300k?"),
                null
        );

        assertTrue(result.messages().get(2).content().contains("I checked the live catalog"));
        assertTrue(result.messages().get(2).recommendations().stream().allMatch(item ->
                item.reason().contains("Matches")
                        || item.reason().contains("Close")
                        || item.reason().contains("Available")
                        || item.reason().contains("Currently")
                        || item.reason().contains("Fits")
                        || item.reason().contains("Related")
                        || item.reason().contains("same category")
                        || item.reason().contains("same product group")
        ));
    }

    @Test
    void sendMessage_ShouldPrioritizeLatestOccasionIntentOverInteractionHistory() {
        User user = user(31L, "gala-priority@aurafit.vn");
        Category events = category(4L, "Events");
        Category cosplay = category(5L, "Cosplay");
        Costume galaCandidate = costume(
                6L,
                "Midnight Evening Gown",
                events,
                metadata("Elegant", "Gala", "Winter", "Black", "formal", "evening"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        Costume cosplayCandidate = costume(
                7L,
                "Moon Warrior Cosplay Set",
                cosplay,
                metadata("Fantasy", "Cosplay", "All Season", "Blue", "anime", "character"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(13L)
                .user(user)
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist đã sẵn sàng.")
                                .build()
                )))
                .build();

        UserInteractionEvent cosplayHistory = interactionEvent(
                601L,
                user,
                "session-priority",
                InteractionEventType.VIEW_PRODUCT,
                InteractionTargetType.COSTUME,
                "7",
                "cosplay anime",
                "{\"style\":\"Fantasy\",\"occasion\":\"Cosplay\",\"season\":\"All Season\",\"category\":\"Cosplay\",\"color\":\"Blue\",\"tags\":[\"anime\",\"character\"]}",
                LocalDateTime.now()
        );

        when(userRepository.findByEmail("gala-priority@aurafit.vn")).thenReturn(Optional.of(user));
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(31L))
                .thenReturn(List.of(cosplayHistory));
        when(aiStylistSessionRepository.findByIdWithMessages(13L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(cosplayCandidate, galaCandidate));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 50L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(13L, null, null, null, null, "Tôi muốn thuê đồ đi dạ hội."),
                "gala-priority@aurafit.vn"
        );

        assertFalse(result.messages().get(2).recommendations().isEmpty());
        assertEquals(6L, result.messages().get(2).recommendations().get(0).costume().id());
        assertTrue(result.messages().get(2).recommendations().get(0).reason().contains("nhu cầu hiện tại")
                || result.messages().get(2).recommendations().get(0).reason().contains("dịp"));
    }

    @Test
    void sendMessage_ShouldKeepPromIntentAboveAoDaiHistoryAndReplyInEnglish() {
        User user = user(32L, "prom-priority@aurafit.vn");
        Category formal = category(6L, "Formal");
        Category traditional = category(7L, "Traditional");
        Costume promCandidate = costume(
                8L,
                "Silver Prom Gown",
                formal,
                metadata("Elegant", "Prom", "Spring", "Silver", "formal", "evening"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );
        Costume aoDaiCandidate = costume(
                9L,
                "Classic White Ao Dai",
                traditional,
                metadata("Traditional", "Ceremony", "Spring", "White", "ao dai", "traditional"),
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE,
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(14L)
                .user(user)
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder()
                                .id(1L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("AI Stylist đã sẵn sàng.")
                                .build()
                )))
                .build();

        UserInteractionEvent aoDaiHistory = interactionEvent(
                701L,
                user,
                "session-prom",
                InteractionEventType.VIEW_PRODUCT,
                InteractionTargetType.COSTUME,
                "9",
                "ao dai truyen thong",
                "{\"style\":\"Traditional\",\"occasion\":\"Ceremony\",\"season\":\"Spring\",\"category\":\"Traditional\",\"color\":\"White\",\"tags\":[\"ao dai\",\"traditional\"]}",
                LocalDateTime.now()
        );

        when(userRepository.findByEmail("prom-priority@aurafit.vn")).thenReturn(Optional.of(user));
        when(userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(32L))
                .thenReturn(List.of(aoDaiHistory));
        when(aiStylistSessionRepository.findByIdWithMessages(14L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(aoDaiCandidate, promCandidate));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 60L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(14L, null, null, null, null, "Recommend me something for prom."),
                "prom-priority@aurafit.vn"
        );

        assertTrue(result.messages().get(2).content().contains("I checked the live catalog"));
        assertEquals(8L, result.messages().get(2).recommendations().get(0).costume().id());
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
    void sendMessage_ShouldExplainPreviousRecommendationsForVietnameseFollowUp() {
        Category formal = category(10L, "Formal");
        Costume blackVest = costume(
                20L,
                "Vest đen công sở",
                formal,
                metadata("Elegant", "Wedding", "All Season", "Black", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume grayVest = costume(
                21L,
                "Vest xám doanh nhân",
                formal,
                metadata("Elegant", "Wedding", "All Season", "Gray", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume midiDress = costume(
                22L,
                "Đầm midi đen tối giản",
                formal,
                metadata("Elegant", "Wedding", "All Season", "Black", "minimal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(19L)
                .guestSessionId("guest-followup")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.USER).content("tôi muốn mặc thật lịch sự để dự tiệc cưới").build(),
                        AiStylistMessage.builder()
                                .id(2L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("Mình đã gợi ý 3 mẫu phù hợp.")
                                .metadataJson("""
                                        {
                                          "detectedIntent":"RECOMMENDATION_REQUEST",
                                          "lastUserNeedSummary":"occasion=wedding, style=formal",
                                          "recommendations":[
                                            {"costumeId":20,"reason":"Phù hợp với dịp cưới và phong cách lịch sự","score":95,"availableItemCount":1},
                                            {"costumeId":21,"reason":"Giữ tổng thể formal nhưng nhẹ hơn đen","score":90,"availableItemCount":1},
                                            {"costumeId":22,"reason":"Thanh lịch và dễ lên hình khi dự tiệc","score":88,"availableItemCount":1}
                                          ]
                                        }
                                        """)
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(19L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(blackVest, grayVest, midiDress));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 110L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(19L, "guest-followup", null, null, null, "vì sao những cái này lại phù hợp với nhu cầu của tôi"),
                null
        );

        assertTrue(result.messages().get(3).content().contains("Các mẫu mình vừa gợi ý phù hợp"));
        assertTrue(result.messages().get(3).content().contains("Vest đen công sở"));
        assertTrue(result.messages().get(3).content().contains("tiệc cưới"));
        assertEquals(3, result.messages().get(3).recommendations().size());
    }

    @Test
    void sendMessage_ShouldExplainPreviousRecommendationsInEnglish() {
        Category formal = category(11L, "Formal");
        Costume blackVest = costume(
                30L,
                "Black Office Vest",
                formal,
                metadata("Elegant", "Wedding", "All Season", "Black", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume grayVest = costume(
                31L,
                "Gray Business Vest",
                formal,
                metadata("Elegant", "Wedding", "All Season", "Gray", "formal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(20L)
                .guestSessionId("guest-followup-en")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.USER).content("I need a formal outfit for a wedding").build(),
                        AiStylistMessage.builder()
                                .id(2L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("These were the strongest matches.")
                                .metadataJson("""
                                        {
                                          "detectedIntent":"RECOMMENDATION_REQUEST",
                                          "lastUserNeedSummary":"occasion=wedding, style=formal",
                                          "recommendations":[
                                            {"costumeId":30,"reason":"Close to your wedding and formal request","score":95,"availableItemCount":1},
                                            {"costumeId":31,"reason":"Formal alternative with a lighter tone","score":92,"availableItemCount":1}
                                          ]
                                        }
                                        """)
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(20L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(blackVest, grayVest));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 120L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(20L, "guest-followup-en", null, null, null, "why did you recommend these?"),
                null
        );

        assertTrue(result.messages().get(3).content().contains("The previous suggestions fit because"));
        assertTrue(result.messages().get(3).content().contains("Black Office Vest"));
        assertEquals(2, result.messages().get(3).recommendations().size());
    }

    @Test
    void sendMessage_ShouldPickBestPreviousRecommendationForFollowUpChoiceQuestion() {
        Category formal = category(12L, "Formal");
        Costume topChoice = costume(
                40L,
                "Vest đen công sở",
                formal,
                metadata("Elegant", "Wedding", "All Season", "Black", "formal"),
                ItemStatus.AVAILABLE
        );
        Costume alternative = costume(
                41L,
                "Vest xám doanh nhân",
                formal,
                metadata("Elegant", "Wedding", "All Season", "Gray", "formal"),
                ItemStatus.AVAILABLE
        );

        AiStylistSession session = AiStylistSession.builder()
                .id(21L)
                .guestSessionId("guest-best")
                .messages(new ArrayList<>(List.of(
                        AiStylistMessage.builder().id(1L).role(AiStylistMessageRole.USER).content("tôi muốn mặc thật lịch sự để dự tiệc cưới").build(),
                        AiStylistMessage.builder()
                                .id(2L)
                                .role(AiStylistMessageRole.ASSISTANT)
                                .content("Mình đã gợi ý 2 mẫu phù hợp.")
                                .metadataJson("""
                                        {
                                          "detectedIntent":"RECOMMENDATION_REQUEST",
                                          "lastUserNeedSummary":"occasion=wedding, style=formal",
                                          "recommendations":[
                                            {"costumeId":40,"reason":"Phù hợp với dịp cưới và phong cách lịch sự","score":95,"availableItemCount":1},
                                            {"costumeId":41,"reason":"Giữ tổng thể formal nhưng nhẹ hơn đen","score":90,"availableItemCount":1}
                                          ]
                                        }
                                        """)
                                .build()
                )))
                .build();

        when(aiStylistSessionRepository.findByIdWithMessages(21L)).thenReturn(Optional.of(session));
        when(costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE))
                .thenReturn(List.of(topChoice, alternative));
        when(aiStylistSessionRepository.save(any(AiStylistSession.class))).thenAnswer(invocation -> persistSession(invocation.getArgument(0), 130L));

        AiStylistSessionDTO result = aiStylistService.sendMessage(
                new SendAiStylistMessageRequest(21L, "guest-best", null, null, null, "cái nào hợp nhất?"),
                null
        );

        assertTrue(result.messages().get(3).content().contains("Vest đen công sở là lựa chọn hợp nhất"));
        assertEquals(2, result.messages().get(3).recommendations().size());
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

    private CostumeMetadata metadataWithFit(String style,
                                            String occasion,
                                            String season,
                                            String color,
                                            String skinTone,
                                            String bodyType,
                                            String material,
                                            String fitNote,
                                            String... tags) {
        CostumeMetadata metadata = metadata(style, occasion, season, color, tags);
        metadata.setSkinTone(skinTone);
        metadata.setBodyType(bodyType);
        metadata.setMaterial(material);
        metadata.setFitNote(fitNote);
        metadata.setSize("M-L");
        return metadata;
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> readAssistantMetadata(AiStylistSession session) throws Exception {
        String metadataJson = session.getMessages().get(session.getMessages().size() - 1).getMetadataJson();
        return objectMapper.readValue(metadataJson, Map.class);
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

    private AiIntentUnderstandingService.IntentUnderstandingResult detectIntent(String message) {
        return detectIntentFromContext(AiChatContext.empty(message));
    }

    private AiIntentUnderstandingService.IntentUnderstandingResult detectIntentFromContext(AiChatContext context) {
        String normalized = context == null || context.latestUserMessage() == null ? "" : context.latestUserMessage().toLowerCase();
        AiIntentUnderstandingService.IntentType intentType = AiIntentUnderstandingService.IntentType.OUT_OF_SCOPE;
        AiIntentUnderstandingService.Language language = normalized.contains("hello")
                || normalized.contains("recommend")
                || normalized.contains("need")
                || normalized.contains("prom")
                ? AiIntentUnderstandingService.Language.EN
                : AiIntentUnderstandingService.Language.VI;
        String occasion = null;
        String style = null;
        String color = null;
        String size = null;
        BigDecimal budget = null;
        boolean isFollowUp = false;
        boolean refersToPreviousRecommendations = context != null && context.hasPreviousRecommendation();

        if (normalized.contains("hello") || normalized.contains("bạn khỏe không") || normalized.contains("ban khoe khong") || normalized.contains("cảm ơn") || normalized.contains("cam on")) {
            intentType = AiIntentUnderstandingService.IntentType.CASUAL_CHAT;
        } else if (normalized.contains("vì sao") || normalized.contains("vi sao")
                || normalized.contains("giải thích") || normalized.contains("giai thich")
                || normalized.contains("why did you recommend these")
                || normalized.contains("cái nào hợp nhất") || normalized.contains("cai nao hop nhat")) {
            intentType = AiIntentUnderstandingService.IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP;
            isFollowUp = true;
        } else if (normalized.contains("đặt cọc") || normalized.contains("dat coc") || normalized.contains("deposit")) {
            intentType = AiIntentUnderstandingService.IntentType.RENTAL_SUPPORT;
        } else if (normalized.contains("size") && (normalized.contains("bộ này") || normalized.contains("bo nay") || normalized.contains("this"))) {
            intentType = AiIntentUnderstandingService.IntentType.PRODUCT_QUESTION;
            size = normalized.contains("xl") ? "XL" : "M";
        } else if (normalized.contains("gợi ý") || normalized.contains("goi y") || normalized.contains("recommend") || normalized.contains("prom")
                || normalized.contains("đám cưới") || normalized.contains("dam cuoi") || normalized.contains("tiệc cưới") || normalized.contains("tiec cuoi")
                || normalized.contains("dạ hội") || normalized.contains("da hoi")) {
            intentType = AiIntentUnderstandingService.IntentType.RECOMMENDATION_REQUEST;
        }

        if (normalized.contains("đám cưới") || normalized.contains("dam cuoi") || normalized.contains("tiệc cưới") || normalized.contains("tiec cuoi") || normalized.contains("wedding")) {
            occasion = "wedding";
        } else if (normalized.contains("prom")) {
            occasion = "prom";
        } else if (normalized.contains("dạ hội") || normalized.contains("da hoi") || normalized.contains("gala")) {
            occasion = "gala";
        }

        if (normalized.contains("lịch sự") || normalized.contains("lich su") || normalized.contains("elegant")) {
            style = "formal";
        }
        if (normalized.contains("màu đỏ") || normalized.contains("mau do") || normalized.contains("red")) {
            color = "red";
        }
        if (normalized.contains("màu đen") || normalized.contains("mau den") || normalized.contains("black")) {
            color = "black";
        }
        if (normalized.contains("300k")) {
            budget = BigDecimal.valueOf(300_000);
        }
        if (normalized.contains("xl")) {
            size = "XL";
        }
        if (normalized.contains("size m")) {
            size = "M";
        }

        return new AiIntentUnderstandingService.IntentUnderstandingResult(
                intentType,
                0.9,
                language,
                occasion,
                style,
                color,
                null,
                size,
                budget,
                normalized.contains("tuần sau") || normalized.contains("tuan sau") || normalized.contains("next week") ? "next_week" : null,
                (normalized.contains("bộ này") || normalized.contains("bo nay") || normalized.contains("this")) ? "current_product" : null,
                isFollowUp,
                refersToPreviousRecommendations,
                "{}",
                false
        );
    }
}
