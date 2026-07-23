package com.aurafit.ai.stylist.service.impl;

import com.aurafit.ai.stylist.service.StylistFilterCriteria;
import com.aurafit.business.catalog.dto.response.CatalogCostumeDTO;
import com.aurafit.ai.stylist.dto.response.ChatMessageResponse;
import com.aurafit.ai.stylist.entity.ChatMessage;
import com.aurafit.ai.stylist.entity.ChatSession;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeMetadata;
import com.aurafit.business.catalog.entity.EventCostume;
import com.aurafit.ai.enrichment.entity.ProductAiMetadata;
import com.aurafit.ai.enrichment.entity.ProductEmbedding;
import com.aurafit.business.user.entity.User;
import com.aurafit.infrastructure.AiCallType;
import com.aurafit.ai.stylist.enums.ChatMessageRole;
import com.aurafit.business.catalog.enums.CostumeStatus;
import com.aurafit.business.catalog.enums.EventStatus;
import com.aurafit.business.catalog.enums.ItemStatus;
import com.aurafit.ai.enrichment.enums.ProductEmbeddingStatus;
import com.aurafit.common.exception.AiProviderException;
import com.aurafit.common.exception.ResourceNotFoundException;
import com.aurafit.infrastructure.GeminiClient;
import com.aurafit.ai.stylist.repository.ChatMessageRepository;
import com.aurafit.ai.stylist.repository.ChatSessionRepository;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.business.catalog.repository.specification.CostumeSpecification;
import com.aurafit.business.catalog.repository.EventCostumeRepository;
import com.aurafit.ai.enrichment.repository.ProductAiMetadataRepository;
import com.aurafit.ai.enrichment.repository.ProductEmbeddingRepository;
import com.aurafit.business.user.repository.UserRepository;
import com.aurafit.ai.stylist.service.StylistIntentService;
import com.aurafit.ai.stylist.service.StylistRecommendationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class StylistRecommendationServiceImpl implements StylistRecommendationService {

    private static final int RECENT_CONVERSATION_TURN_LIMIT = 3;
    private static final int RECENT_CONVERSATION_MESSAGE_LIMIT = RECENT_CONVERSATION_TURN_LIMIT * 2;
    private static final int CONTEXT_MESSAGE_MAX_LENGTH = 500;
    private static final int RECOMMENDATION_LIMIT = 12;
    private static final int RELAXED_CANDIDATE_POOL_SIZE = 60;
    private static final int DAILY_USER_MESSAGE_LIMIT = 20;
    private static final int MIN_SEARCH_TOKEN_LENGTH = 3;
    private static final int DESCRIPTION_MAX_LENGTH = 150;
    private static final int ENRICHED_TAGS_PER_FIELD_LIMIT = 4;
    private static final int ENRICHED_TAG_FIELD_MAX_LENGTH = 60;
    private static final double EMBEDDING_SIMILARITY_TIE_BAND = 0.01D;
    private static final String NO_RESULTS_REPLY = "Xin lỗi, hiện chưa tìm thấy sản phẩm phù hợp với yêu cầu, bạn có thể mô tả cụ thể hơn không?";
    private static final String DAILY_LIMIT_REPLY = "Bạn đã đạt giới hạn tư vấn hôm nay, vui lòng quay lại vào ngày mai";
    private static final Pattern RECOMMENDED_IDS_PATTERN = Pattern.compile(
            "(?im)^\\s*RECOMMENDED_IDS\\s*:\\s*([0-9]+(?:\\s*,\\s*[0-9]+)*)\\s*$"
    );

    private static final String RECOMMENDATION_SYSTEM_PROMPT = """
            Bạn là stylist thời trang của AuraFit.
            Chỉ được gợi ý trong danh sách sản phẩm được cung cấp, không được bịa sản phẩm ngoài danh sách.
            Trả lời bằng tiếng Việt, giọng văn tư vấn thời trang thân thiện, ngắn gọn dưới 150 từ.
            Chỉ nhắc đến những sản phẩm thực sự phù hợp với yêu cầu khách hàng.
            Dùng ngữ cảnh hội thoại gần nhất để hiểu các câu hỏi nối tiếp, thay đổi hoặc so sánh với gợi ý trước đó.
            Nếu yêu cầu hiện tại mâu thuẫn với lịch sử, luôn ưu tiên yêu cầu hiện tại.
            Nếu sản phẩm phù hợp đang có ưu đãi, hãy nhắc đến ưu đãi đó một cách tự nhiên; không đề cập ưu đãi của sản phẩm không phù hợp với yêu cầu khách.
            Dòng cuối bắt buộc có đúng định dạng RECOMMENDED_IDS: 1,5,9 và chỉ chứa ID từ danh sách được cung cấp.
            Không giải thích dòng RECOMMENDED_IDS và không đặt nội dung nào sau dòng đó.
            """;

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CostumeRepository costumeRepository;
    private final EventCostumeRepository eventCostumeRepository;
    private final ProductAiMetadataRepository productAiMetadataRepository;
    private final ProductEmbeddingRepository productEmbeddingRepository;
    private final UserRepository userRepository;
    private final StylistIntentService stylistIntentService;
    private final MetadataTagResolver metadataTagResolver;
    private final StylistCategoryResolver stylistCategoryResolver;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;
    private final String embeddingModel;

    public StylistRecommendationServiceImpl(
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            CostumeRepository costumeRepository,
            EventCostumeRepository eventCostumeRepository,
            ProductAiMetadataRepository productAiMetadataRepository,
            ProductEmbeddingRepository productEmbeddingRepository,
            UserRepository userRepository,
            StylistIntentService stylistIntentService,
            MetadataTagResolver metadataTagResolver,
            StylistCategoryResolver stylistCategoryResolver,
            GeminiClient geminiClient,
            ObjectMapper objectMapper,
            @Value("${ai.embedding-model:}") String embeddingModel
    ) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.costumeRepository = costumeRepository;
        this.eventCostumeRepository = eventCostumeRepository;
        this.productAiMetadataRepository = productAiMetadataRepository;
        this.productEmbeddingRepository = productEmbeddingRepository;
        this.userRepository = userRepository;
        this.stylistIntentService = stylistIntentService;
        this.metadataTagResolver = metadataTagResolver;
        this.stylistCategoryResolver = stylistCategoryResolver;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
        this.embeddingModel = embeddingModel == null ? "" : embeddingModel.trim();
    }

    @Override
    @Transactional
    public ChatMessageResponse handleUserMessage(String sessionId, Long userId, String userMessage) {
        ChatSession chatSession = findOrCreateSession(sessionId, userId);

        if (hasReachedDailyLimit(chatSession)) {
            return new ChatMessageResponse(chatSession.getSessionId(), DAILY_LIMIT_REPLY, List.of());
        }

        ChatMessage previousUserMessage = chatMessageRepository
                .findFirstByChatSessionAndRoleOrderByCreatedAtDesc(chatSession, ChatMessageRole.USER)
                .orElse(null);
        List<ChatMessage> recentHistory = getRecentHistory(chatSession);

        ChatMessage savedUserMessage = chatMessageRepository.save(ChatMessage.builder()
                .chatSession(chatSession)
                .role(ChatMessageRole.USER)
                .content(userMessage.trim())
                .build());

        try {
            StylistFilterCriteria extractedCriteria = resolveIntent(
                    userMessage,
                    recentHistory,
                    previousUserMessage
            );
            StylistFilterCriteria normalizedCriteria = metadataTagResolver.resolve(extractedCriteria);
            StylistFilterCriteria criteria = stylistCategoryResolver.resolve(
                    normalizedCriteria,
                    userMessage
            );
            savedUserMessage.setIntentJson(serializeCriteria(criteria));
            chatMessageRepository.save(savedUserMessage);

            CandidateSelection candidateSelection = findCandidates(criteria, userMessage);
            List<Costume> candidates = candidateSelection.candidates();

            if (candidates.isEmpty()) {
                saveAssistantMessage(chatSession, NO_RESULTS_REPLY, null);
                return new ChatMessageResponse(chatSession.getSessionId(), NO_RESULTS_REPLY, List.of());
            }

            String rawReply = geminiClient.generateText(
                    AiCallType.RESPONSE_GENERATION,
                    RECOMMENDATION_SYSTEM_PROMPT,
                    buildRecommendationPrompt(
                            userMessage,
                            recentHistory,
                            candidates,
                            candidateSelection.activeOffersByCostumeId()
                    )
            );

            ParsedRecommendation parsedRecommendation = parseRecommendation(rawReply, candidates);
            String recommendedIds = parsedRecommendation.costumeIds().isEmpty()
                    ? null
                    : parsedRecommendation.costumeIds().stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(","));

            saveAssistantMessage(chatSession, parsedRecommendation.replyText(), recommendedIds);

            List<Costume> recommendedCostumeEntities = parsedRecommendation.costumeIds().stream()
                    .map(costumeRepository::findByIdWithItems)
                    .flatMap(java.util.Optional::stream)
                    .filter(this::isEligibleStylistCostume)
                    .toList();
            Map<Long, ActiveEventOffer> responseOffersByCostumeId = loadActiveEventOffers(
                    recommendedCostumeEntities.stream().map(Costume::getId).toList(),
                    LocalDateTime.now()
            );
            List<CatalogCostumeDTO> recommendedCostumes = recommendedCostumeEntities.stream()
                    .map(costume -> toCatalogCostumeDTO(
                            costume,
                            responseOffersByCostumeId.get(costume.getId())
                    ))
                    .toList();

            return new ChatMessageResponse(
                    chatSession.getSessionId(),
                    parsedRecommendation.replyText(),
                    recommendedCostumes
            );
        } catch (AiProviderException exception) {
            saveAssistantMessage(chatSession, exception.getUserFriendlyMessage(), null);
            return ChatMessageResponse.error(
                    chatSession.getSessionId(),
                    exception.getUserFriendlyMessage(),
                    exception.getErrorType().name()
            );
        }
    }

    private ChatSession findOrCreateSession(String sessionId, Long userId) {
        String resolvedSessionId = StringUtils.hasText(sessionId)
                ? sessionId.trim()
                : UUID.randomUUID().toString();
        User user = userId == null
                ? null
                : userRepository.findById(userId).orElse(null);

        return chatSessionRepository.findBySessionId(resolvedSessionId)
                .map(existingSession -> attachUserIfNeeded(existingSession, user))
                .orElseGet(() -> chatSessionRepository.save(ChatSession.builder()
                        .sessionId(resolvedSessionId)
                        .user(user)
                        .build()));
    }

    private boolean hasReachedDailyLimit(ChatSession chatSession) {
        java.time.LocalDate today = java.time.LocalDate.now();
        long userMessageCount = chatMessageRepository
                .countByChatSessionAndRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        chatSession,
                        ChatMessageRole.USER,
                        today.atStartOfDay(),
                        today.plusDays(1).atStartOfDay()
                );
        return userMessageCount >= DAILY_USER_MESSAGE_LIMIT;
    }

    private StylistFilterCriteria resolveIntent(
            String userMessage,
            List<ChatMessage> recentHistory,
            ChatMessage previousUserMessage
    ) {
        if (canReusePreviousIntent(userMessage, previousUserMessage)) {
            return deserializeCriteria(previousUserMessage.getIntentJson());
        }

        return stylistIntentService.extractIntent(userMessage, recentHistory);
    }

    private boolean canReusePreviousIntent(String userMessage, ChatMessage previousUserMessage) {
        return previousUserMessage != null
                && StringUtils.hasText(previousUserMessage.getIntentJson())
                && normalizeMessage(userMessage).equals(normalizeMessage(previousUserMessage.getContent()));
    }

    private String normalizeMessage(String message) {
        if (message == null) {
            return "";
        }

        return message.toLowerCase(Locale.ROOT)
                .replaceAll("\\p{P}+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private StylistFilterCriteria deserializeCriteria(String intentJson) {
        try {
            return objectMapper.readValue(intentJson, StylistFilterCriteria.class);
        } catch (JsonProcessingException | IllegalArgumentException exception) {
            return StylistFilterCriteria.empty();
        }
    }

    private ChatSession attachUserIfNeeded(ChatSession chatSession, User user) {
        if (chatSession.getUser() == null) {
            if (user != null) {
                chatSession.setUser(user);
                return chatSessionRepository.save(chatSession);
            }
            return chatSession;
        }

        if (user == null || !Objects.equals(chatSession.getUser().getId(), user.getId())) {
            throw new ResourceNotFoundException(
                    "ChatSession",
                    "sessionId",
                    chatSession.getSessionId()
            );
        }

        return chatSession;
    }

    private List<ChatMessage> getRecentHistory(ChatSession chatSession) {
        List<ChatMessage> recentMessages = new ArrayList<>(
                chatMessageRepository.findByChatSessionOrderByCreatedAtDesc(
                        chatSession,
                        PageRequest.of(0, RECENT_CONVERSATION_MESSAGE_LIMIT)
                )
                        .stream()
                        .filter(message -> message.getRole() == ChatMessageRole.USER
                                || message.getRole() == ChatMessageRole.ASSISTANT)
                        .limit(RECENT_CONVERSATION_MESSAGE_LIMIT)
                        .toList()
        );
        Collections.reverse(recentMessages);
        return recentMessages;
    }

    private CandidateSelection findCandidates(StylistFilterCriteria criteria, String userMessage) {
        List<Costume> strictCandidates = costumeRepository.findAll(
                CostumeSpecification.build(criteria),
                recommendationPage(RELAXED_CANDIDATE_POOL_SIZE)
        ).getContent();
        if (!strictCandidates.isEmpty()) {
            Map<Long, ActiveEventOffer> activeOffers = loadActiveEventOffers(
                    strictCandidates.stream().map(Costume::getId).toList(),
                    LocalDateTime.now()
            );
            List<Costume> rankedStrictCandidates = strictCandidates.stream()
                    .sorted(Comparator.comparingInt(Costume::getAvailableItemCount)
                            .reversed()
                            .thenComparing(costume -> activeOffers.containsKey(costume.getId()) ? 0 : 1)
                            .thenComparing(Costume::getId))
                    .limit(RECOMMENDATION_LIMIT)
                    .toList();
            return new CandidateSelection(rankedStrictCandidates, activeOffers);
        }

        CandidateSelection embeddingCandidates = findEmbeddingCandidates(criteria, userMessage);
        if (!embeddingCandidates.candidates().isEmpty()) {
            return embeddingCandidates;
        }

        return findLegacyFallbackCandidates(criteria, userMessage);
    }

    private CandidateSelection findEmbeddingCandidates(
            StylistFilterCriteria criteria,
            String userMessage
    ) {
        int embeddingCallCount = 0;
        try {
            List<ProductEmbedding> embeddings = productEmbeddingRepository
                    .findAllByEligibleCostume(CostumeStatus.ACTIVE, ItemStatus.AVAILABLE);
            if (embeddings == null || embeddings.isEmpty()) {
                log.warn(
                        "Stylist embedding fallback unavailable reason=no_active_available_embeddings "
                                + "previousFallbackAiCalls=0 currentEmbeddingCalls=0 safetyFallback=java_relevance"
                );
                return CandidateSelection.empty();
            }
            if (!StringUtils.hasText(embeddingModel)) {
                log.warn(
                        "Stylist embedding fallback unavailable reason=embedding_model_not_configured "
                                + "previousFallbackAiCalls=0 currentEmbeddingCalls=0 safetyFallback=java_relevance"
                );
                return CandidateSelection.empty();
            }

            embeddingCallCount++;
            GeminiClient.EmbeddingResult queryEmbedding = geminiClient.embedText(
                    embeddingModel,
                    buildEmbeddingQueryText(criteria, userMessage)
            );
            float[] queryVector = toFloatArray(queryEmbedding.values());
            List<ScoredEmbedding> scoredEmbeddings = new ArrayList<>();

            for (ProductEmbedding embedding : embeddings) {
                if (embedding.getStatus() != ProductEmbeddingStatus.READY) {
                    log.warn(
                            "Skipping costume embedding costumeId={} status={} expectedStatus=READY",
                            embedding.getCostumeId(),
                            embedding.getStatus()
                    );
                    continue;
                }
                if (!queryEmbedding.model().equals(embedding.getEmbeddingModel())) {
                    log.warn(
                            "Skipping costume embedding costumeId={} reason=model_mismatch queryModel={} productModel={}",
                            embedding.getCostumeId(),
                            queryEmbedding.model(),
                            embedding.getEmbeddingModel()
                    );
                    continue;
                }

                try {
                    float[] productVector = parseEmbeddingPayload(embedding);
                    double similarity = CosineSimilarity.calculate(queryVector, productVector);
                    scoredEmbeddings.add(new ScoredEmbedding(embedding.getCostumeId(), similarity));
                } catch (Exception exception) {
                    log.warn(
                            "Skipping costume embedding costumeId={} reason=invalid_payload message={}",
                            embedding.getCostumeId(),
                            exception.getMessage()
                    );
                }
            }

            List<ScoredEmbedding> rankingPool = scoredEmbeddings.stream()
                    .sorted(Comparator.comparingDouble(ScoredEmbedding::similarity)
                            .reversed()
                            .thenComparing(ScoredEmbedding::costumeId))
                    .limit(RELAXED_CANDIDATE_POOL_SIZE)
                    .toList();
            Map<Long, ActiveEventOffer> activeOffers = loadActiveEventOffers(
                    rankingPool.stream().map(ScoredEmbedding::costumeId).toList(),
                    LocalDateTime.now()
            );
            List<Long> rankedCostumeIds = rankingPool.stream()
                    .sorted(Comparator.comparingLong(
                                    (ScoredEmbedding scored) -> similarityTieBand(scored.similarity())
                            )
                            .reversed()
                            .thenComparing(scored -> activeOffers.containsKey(scored.costumeId()) ? 0 : 1)
                            .thenComparing(Comparator.comparingDouble(ScoredEmbedding::similarity).reversed())
                            .thenComparing(ScoredEmbedding::costumeId))
                    .limit(RECOMMENDATION_LIMIT)
                    .map(ScoredEmbedding::costumeId)
                    .toList();
            if (rankedCostumeIds.isEmpty()) {
                log.warn(
                        "Stylist embedding fallback unavailable reason=no_valid_embeddings "
                                + "previousFallbackAiCalls=0 currentEmbeddingCalls={} safetyFallback=java_relevance",
                        embeddingCallCount
                );
                return CandidateSelection.empty();
            }

            Map<Long, Costume> costumesById = costumeRepository.findAllByIdWithMetadata(rankedCostumeIds)
                    .stream()
                    .filter(this::isEligibleStylistCostume)
                    .collect(Collectors.toMap(Costume::getId, costume -> costume));
            List<Costume> rankedCostumes = rankedCostumeIds.stream()
                    .map(costumesById::get)
                    .filter(Objects::nonNull)
                    .toList();
            log.info(
                    "Stylist embedding fallback completed previousFallbackAiCalls=0 currentEmbeddingCalls={} "
                            + "loadedEmbeddings={} validEmbeddings={} selectedCandidates={}",
                    embeddingCallCount,
                    embeddings.size(),
                    scoredEmbeddings.size(),
                    rankedCostumes.size()
            );
            return new CandidateSelection(rankedCostumes, activeOffers);
        } catch (Exception exception) {
            log.warn(
                    "Stylist embedding fallback failed errorType={} message={} previousFallbackAiCalls=0 "
                            + "currentEmbeddingCalls={} safetyFallback=java_relevance",
                    exception.getClass().getSimpleName(),
                    exception.getMessage(),
                    embeddingCallCount
            );
            return CandidateSelection.empty();
        }
    }

    private String buildEmbeddingQueryText(StylistFilterCriteria criteria, String userMessage) {
        StringBuilder query = new StringBuilder();
        appendEmbeddingQueryField(query, "Yêu cầu khách hàng", userMessage);
        appendEmbeddingQueryField(query, "Danh mục", criteria.category());
        appendEmbeddingQueryField(query, "Phong cách", criteria.style());
        appendEmbeddingQueryField(query, "Dịp sử dụng", criteria.occasion());
        appendEmbeddingQueryField(query, "Mùa", criteria.season());
        appendEmbeddingQueryField(query, "Màu sắc", criteria.color());
        appendEmbeddingQueryField(query, "Giới tính", criteria.gender());
        if (criteria.tags() != null && !criteria.tags().isEmpty()) {
            appendEmbeddingQueryField(query, "Tags", String.join(", ", criteria.tags()));
        }
        appendEmbeddingQueryField(query, "Ngân sách tối thiểu", criteria.minBudget());
        appendEmbeddingQueryField(query, "Ngân sách tối đa", criteria.maxBudget());
        return query.toString().trim();
    }

    private void appendEmbeddingQueryField(StringBuilder query, String label, Object value) {
        if (value != null && StringUtils.hasText(value.toString())) {
            query.append(label).append(": ").append(value).append('\n');
        }
    }

    private float[] toFloatArray(List<Float> values) {
        if (values == null || values.isEmpty()) {
            throw new IllegalArgumentException("Gemini query embedding is empty.");
        }
        float[] vector = new float[values.size()];
        for (int index = 0; index < values.size(); index++) {
            Float value = values.get(index);
            if (value == null || !Float.isFinite(value)) {
                throw new IllegalArgumentException("Gemini query embedding contains a non-finite value.");
            }
            vector[index] = value;
        }
        return vector;
    }

    private float[] parseEmbeddingPayload(ProductEmbedding embedding) throws JsonProcessingException {
        float[] vector = objectMapper.readValue(embedding.getEmbeddingPayload(), float[].class);
        if (vector.length == 0
                || embedding.getEmbeddingDimension() == null
                || embedding.getEmbeddingDimension() != vector.length) {
            throw new IllegalArgumentException("Stored embedding dimension does not match its payload.");
        }
        for (float value : vector) {
            if (!Float.isFinite(value)) {
                throw new IllegalArgumentException("Stored embedding contains a non-finite value.");
            }
        }
        return vector;
    }

    private CandidateSelection findLegacyFallbackCandidates(
            StylistFilterCriteria criteria,
            String userMessage
    ) {
        List<String> searchTerms = buildSearchTerms(criteria, userMessage);
        List<Costume> relaxedCandidates = costumeRepository.findAll(
                CostumeSpecification.buildRelaxed(criteria, searchTerms),
                recommendationPage(RELAXED_CANDIDATE_POOL_SIZE)
        ).getContent();

        if (relaxedCandidates.isEmpty() && StringUtils.hasText(criteria.category())) {
            StylistFilterCriteria categoryAndBudgetOnly = new StylistFilterCriteria(
                    criteria.category(),
                    criteria.requestedItem(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    criteria.minBudget(),
                    criteria.maxBudget()
            );
            relaxedCandidates = costumeRepository.findAll(
                    CostumeSpecification.build(categoryAndBudgetOnly),
                    recommendationPage(RELAXED_CANDIDATE_POOL_SIZE)
            ).getContent();
        }

        Map<Long, ActiveEventOffer> activeOffers = loadActiveEventOffers(
                relaxedCandidates.stream().map(Costume::getId).toList(),
                LocalDateTime.now()
        );
        return new CandidateSelection(
                rankCandidates(relaxedCandidates, searchTerms, activeOffers),
                activeOffers
        );
    }

    private record ScoredEmbedding(Long costumeId, double similarity) {
    }

    private record ActiveEventOffer(
            Long eventId,
            String eventName,
            BigDecimal discountPercent,
            BigDecimal finalPrice
    ) {
    }

    private record CandidateSelection(
            List<Costume> candidates,
            Map<Long, ActiveEventOffer> activeOffersByCostumeId
    ) {
        private static CandidateSelection empty() {
            return new CandidateSelection(List.of(), Map.of());
        }
    }

    private long similarityTieBand(double similarity) {
        return Math.round(similarity / EMBEDDING_SIMILARITY_TIE_BAND);
    }

    private Map<Long, ActiveEventOffer> loadActiveEventOffers(
            List<Long> costumeIds,
            LocalDateTime now
    ) {
        if (costumeIds == null || costumeIds.isEmpty()) {
            return Map.of();
        }

        List<Long> distinctCostumeIds = costumeIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (distinctCostumeIds.isEmpty()) {
            return Map.of();
        }

        List<EventCostume> activeAssignments = eventCostumeRepository
                .findActiveEventsForCostumeIds(distinctCostumeIds, now);
        if (activeAssignments == null || activeAssignments.isEmpty()) {
            return Map.of();
        }

        Map<Long, ActiveEventOffer> offersByCostumeId = new LinkedHashMap<>();
        for (EventCostume assignment : activeAssignments) {
            if (!isActiveAt(assignment, now)) {
                continue;
            }
            BigDecimal discountPercent = assignment.getDiscountPercentOverride() != null
                    ? assignment.getDiscountPercentOverride()
                    : assignment.getEvent().getDiscountPercent();
            if (!isValidDiscount(discountPercent)) {
                continue;
            }

            Costume costume = assignment.getCostume();
            BigDecimal finalPrice = calculateFinalPrice(costume.getRentalPrice(), discountPercent);
            ActiveEventOffer offer = new ActiveEventOffer(
                    assignment.getEvent().getId(),
                    assignment.getEvent().getName(),
                    discountPercent,
                    finalPrice
            );
            offersByCostumeId.merge(costume.getId(), offer, this::selectBetterOffer);
        }
        return Map.copyOf(offersByCostumeId);
    }

    private boolean isActiveAt(EventCostume assignment, LocalDateTime now) {
        if (assignment == null || assignment.getEvent() == null || assignment.getCostume() == null) {
            return false;
        }
        return assignment.getEvent().getStatus() == EventStatus.ACTIVE
                && assignment.getEvent().getStartDate() != null
                && !assignment.getEvent().getStartDate().isAfter(now)
                && assignment.getEvent().getEndDate() != null
                && !assignment.getEvent().getEndDate().isBefore(now);
    }

    private boolean isValidDiscount(BigDecimal discountPercent) {
        return discountPercent != null
                && discountPercent.compareTo(BigDecimal.ZERO) > 0
                && discountPercent.compareTo(BigDecimal.valueOf(100)) <= 0;
    }

    private BigDecimal calculateFinalPrice(BigDecimal rentalPrice, BigDecimal discountPercent) {
        return rentalPrice
                .multiply(BigDecimal.valueOf(100).subtract(discountPercent))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
    }

    private ActiveEventOffer selectBetterOffer(ActiveEventOffer current, ActiveEventOffer candidate) {
        int discountComparison = candidate.discountPercent().compareTo(current.discountPercent());
        if (discountComparison != 0) {
            return discountComparison > 0 ? candidate : current;
        }
        if (current.eventId() == null) {
            return candidate;
        }
        if (candidate.eventId() == null) {
            return current;
        }
        return candidate.eventId() < current.eventId() ? candidate : current;
    }

    private CatalogCostumeDTO toCatalogCostumeDTO(Costume costume, ActiveEventOffer activeOffer) {
        if (activeOffer == null) {
            return CatalogCostumeDTO.fromEntity(costume);
        }
        return CatalogCostumeDTO.fromEntity(
                costume,
                activeOffer.discountPercent(),
                activeOffer.finalPrice(),
                activeOffer.eventName()
        );
    }

    private String formatDecimal(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    private boolean isEligibleStylistCostume(Costume costume) {
        return costume != null
                && costume.getStatus() == CostumeStatus.ACTIVE
                && costume.getCategory() != null
                && Boolean.TRUE.equals(costume.getCategory().getIsActive())
                && costume.getAvailableItemCount() > 0;
    }

    private PageRequest recommendationPage(int size) {
        return PageRequest.of(
                0,
                size,
                Sort.by(Sort.Direction.DESC, "availableItemCount")
        );
    }

    private List<String> buildSearchTerms(StylistFilterCriteria criteria, String userMessage) {
        LinkedHashSet<String> searchTerms = new LinkedHashSet<>();
        addSearchTerms(searchTerms, userMessage);
        addSearchTerms(searchTerms, criteria.requestedItem());
        addSearchTerms(searchTerms, criteria.style());
        addSearchTerms(searchTerms, criteria.occasion());
        addSearchTerms(searchTerms, criteria.season());
        addSearchTerms(searchTerms, criteria.color());
        addSearchTerms(searchTerms, criteria.gender());
        if (criteria.tags() != null) {
            criteria.tags().forEach(tag -> addSearchTerms(searchTerms, tag));
        }
        return List.copyOf(searchTerms);
    }

    private void addSearchTerms(LinkedHashSet<String> searchTerms, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }

        String normalizedValue = value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        if (normalizedValue.length() >= MIN_SEARCH_TOKEN_LENGTH) {
            searchTerms.add(normalizedValue);
        }

        String asciiValue = normalizeSearchText(value);
        if (asciiValue.length() >= MIN_SEARCH_TOKEN_LENGTH) {
            searchTerms.add(asciiValue.replace(' ', '-'));
        }

        for (String token : normalizedValue.split("[^\\p{L}\\p{N}]+")) {
            if (token.length() >= MIN_SEARCH_TOKEN_LENGTH) {
                searchTerms.add(token);
            }
        }
    }

    private List<Costume> rankCandidates(
            List<Costume> candidates,
            List<String> searchTerms,
            Map<Long, ActiveEventOffer> activeOffers
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        List<String> normalizedTerms = searchTerms.stream()
                .map(this::normalizeSearchText)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();

        return candidates.stream()
                .sorted(Comparator.comparingInt(
                                (Costume costume) -> relevanceScore(costume, normalizedTerms)
                        )
                        .reversed()
                        .thenComparing(Comparator.comparingInt(Costume::getAvailableItemCount).reversed())
                        .thenComparing(costume -> activeOffers.containsKey(costume.getId()) ? 0 : 1)
                        .thenComparing(Costume::getId))
                .limit(RECOMMENDATION_LIMIT)
                .toList();
    }

    private int relevanceScore(Costume costume, List<String> searchTerms) {
        CostumeMetadata metadata = costume.getMetadata();
        String name = normalizeSearchText(costume.getName());
        String category = costume.getCategory() == null
                ? ""
                : normalizeSearchText(costume.getCategory().getName() + " " + costume.getCategory().getPath());
        String style = metadata == null ? "" : normalizeSearchText(metadata.getStyle());
        String occasion = metadata == null ? "" : normalizeSearchText(metadata.getOccasion());
        String season = metadata == null ? "" : normalizeSearchText(metadata.getSeason());
        String color = metadata == null ? "" : normalizeSearchText(metadata.getColor());
        String gender = metadata == null ? "" : normalizeSearchText(metadata.getGender());
        String tags = metadata == null || metadata.getTags() == null
                ? ""
                : normalizeSearchText(String.join(" ", metadata.getTags()));

        int score = 0;
        for (String term : searchTerms) {
            if (name.contains(term)) {
                score += 8;
            }
            if (category.contains(term)) {
                score += 6;
            }
            if (tags.contains(term)) {
                score += 5;
            }
            if (color.contains(term)) {
                score += 4;
            }
            if (style.contains(term) || occasion.contains(term)) {
                score += 3;
            }
            if (season.contains(term) || gender.contains(term)) {
                score += 2;
            }
        }
        return score;
    }

    private String normalizeSearchText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return Normalizer.normalize(
                        value.replace('Đ', 'D').replace('đ', 'd'),
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String serializeCriteria(StylistFilterCriteria criteria) {
        try {
            return objectMapper.writeValueAsString(criteria);
        } catch (JsonProcessingException exception) {
            return null;
        }
    }

    private String buildRecommendationPrompt(
            String userMessage,
            List<ChatMessage> recentHistory,
            List<Costume> candidates,
            Map<Long, ActiveEventOffer> activeOffersByCostumeId
    ) {
        Map<Long, ProductAiMetadata> aiMetadataByCostumeId = loadProductAiMetadata(candidates);
        StringBuilder prompt = new StringBuilder("Ngữ cảnh hội thoại gần nhất (cũ đến mới):\n");
        appendConversationContext(prompt, recentHistory);
        prompt.append("\nYêu cầu hiện tại của khách hàng: ")
                .append(userMessage)
                .append("\n\nDanh sách sản phẩm được phép gợi ý:\n");

        candidates.forEach(costume -> {
            CostumeMetadata metadata = costume.getMetadata();
            ProductAiMetadata aiMetadata = aiMetadataByCostumeId.get(costume.getId());
            prompt.append("ID: ").append(costume.getId())
                    .append(" | Tên: ").append(costume.getName())
                    .append(" | Mô tả: ").append(summarizeDescription(costume.getDescription()))
                    .append(" | Giá thuê: ").append(costume.getRentalPrice())
                    .append(" | Category: ").append(costume.getCategory().getName())
                    .append(" | Style tags: ").append(preferredPromptValue(
                            aiMetadata == null ? null : aiMetadata.getStyleTags(),
                            metadata == null ? null : metadata.getStyle()
                    ))
                    .append(" | Occasion tags: ").append(preferredPromptValue(
                            aiMetadata == null ? null : aiMetadata.getOccasionTags(),
                            metadata == null ? null : metadata.getOccasion()
                    ))
                    .append(" | Season tags: ").append(preferredPromptValue(
                            aiMetadata == null ? null : aiMetadata.getSeasonTags(),
                            metadata == null ? null : metadata.getSeason()
                    ))
                    .append(" | Color tags: ").append(preferredPromptValue(
                            aiMetadata == null ? null : aiMetadata.getColorTags(),
                            metadata == null ? null : metadata.getColor()
                    ))
                    .append(" | Gender tags: ").append(preferredPromptValue(
                            aiMetadata == null ? null : aiMetadata.getGenderTags(),
                            metadata == null ? null : metadata.getGender()
                    ))
                    .append(" | Tags: ").append(metadata != null && metadata.getTags() != null
                            ? String.join(", ", metadata.getTags())
                            : "không có")
                    .append(" | Size tags: ").append(preferredPromptValue(
                            aiMetadata == null ? null : aiMetadata.getSizeTags(),
                            metadata == null ? null : metadata.getSize()
                    ))
                    .append(" | Material tags: ").append(preferredPromptValue(
                            aiMetadata == null ? null : aiMetadata.getMaterialTags(),
                            metadata == null ? null : metadata.getMaterial()
                    ))
                    .append(" | Fit tags: ").append(preferredPromptValue(
                            aiMetadata == null ? null : aiMetadata.getFitTags(),
                            metadata == null ? null : metadata.getFitNote()
                    ));
            String trendTags = summarizeEnrichedTags(
                    aiMetadata == null ? null : aiMetadata.getTrendTags()
            );
            if (StringUtils.hasText(trendTags)) {
                prompt.append(" | Trend tags: ").append(trendTags);
            }
            ActiveEventOffer activeOffer = activeOffersByCostumeId.get(costume.getId());
            if (activeOffer != null) {
                prompt.append(" | Ưu đãi: ")
                        .append(activeOffer.eventName())
                        .append(" giảm ")
                        .append(formatDecimal(activeOffer.discountPercent()))
                        .append("% (còn ")
                        .append(formatDecimal(activeOffer.finalPrice()))
                        .append("đ)");
            }
            prompt.append('\n');
        });

        String completedPrompt = prompt.toString();
        log.info(
                "Stylist candidate prompt built candidateCount={} promptChars={} estimatedInputTokens={} "
                        + "descriptionMaxChars={} enrichedTagFieldMaxChars={}",
                candidates.size(),
                completedPrompt.length(),
                estimateInputTokens(completedPrompt),
                DESCRIPTION_MAX_LENGTH,
                ENRICHED_TAG_FIELD_MAX_LENGTH
        );
        return completedPrompt;
    }

    private void appendConversationContext(StringBuilder prompt, List<ChatMessage> recentHistory) {
        if (recentHistory == null || recentHistory.isEmpty()) {
            prompt.append("(không có)\n");
            return;
        }

        recentHistory.forEach(message -> {
            String speaker = message.getRole() == ChatMessageRole.USER ? "Khách hàng" : "Stylist";
            prompt.append(speaker)
                    .append(": ")
                    .append(summarizeContextMessage(message.getContent()));
            if (message.getRole() == ChatMessageRole.ASSISTANT
                    && StringUtils.hasText(message.getRecommendedCostumeIds())) {
                prompt.append(" [ID sản phẩm đã gợi ý: ")
                        .append(message.getRecommendedCostumeIds().trim())
                        .append(']');
            }
            prompt.append('\n');
        });
    }

    private String summarizeContextMessage(String content) {
        if (!StringUtils.hasText(content)) {
            return "(trống)";
        }
        String normalized = content.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= CONTEXT_MESSAGE_MAX_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, CONTEXT_MESSAGE_MAX_LENGTH - 3).trim() + "...";
    }

    private Map<Long, ProductAiMetadata> loadProductAiMetadata(List<Costume> candidates) {
        List<Long> costumeIds = candidates.stream()
                .map(Costume::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (costumeIds.isEmpty()) {
            return Map.of();
        }

        try {
            return productAiMetadataRepository.findAllByCostumeIdIn(costumeIds)
                    .stream()
                    .collect(Collectors.toMap(
                            ProductAiMetadata::getCostumeId,
                            aiMetadata -> aiMetadata,
                            (left, right) -> left
                    ));
        } catch (Exception exception) {
            log.warn(
                    "Unable to load enriched product metadata for Stylist prompt; using raw costume metadata "
                            + "candidateCount={} errorType={} message={}",
                    candidates.size(),
                    exception.getClass().getSimpleName(),
                    exception.getMessage()
            );
            return Map.of();
        }
    }

    private String preferredPromptValue(List<String> enrichedTags, String rawFallback) {
        String enrichedValue = summarizeEnrichedTags(enrichedTags);
        if (StringUtils.hasText(enrichedValue)) {
            return enrichedValue;
        }
        return StringUtils.hasText(rawFallback) ? rawFallback : "không có";
    }

    private String summarizeEnrichedTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }

        StringBuilder summary = new StringBuilder();
        List<String> distinctTags = tags.stream()
                .filter(StringUtils::hasText)
                .map(tag -> tag.trim().replaceAll("\\s+", " "))
                .distinct()
                .limit(ENRICHED_TAGS_PER_FIELD_LIMIT)
                .toList();
        for (String tag : distinctTags) {
            String separator = summary.isEmpty() ? "" : ", ";
            String nextValue = separator + tag;
            int nextLength = summary.toString().codePointCount(0, summary.length())
                    + nextValue.codePointCount(0, nextValue.length());
            if (nextLength > ENRICHED_TAG_FIELD_MAX_LENGTH) {
                if (summary.isEmpty()) {
                    return truncateText(tag, ENRICHED_TAG_FIELD_MAX_LENGTH);
                }
                break;
            }
            summary.append(nextValue);
        }
        return summary.toString();
    }

    private int estimateInputTokens(String value) {
        return value == null || value.isEmpty() ? 0 : (value.length() + 3) / 4;
    }

    private String summarizeDescription(String description) {
        if (!StringUtils.hasText(description)) {
            return "không có";
        }

        String normalizedDescription = description.trim().replaceAll("\\s+", " ");
        int characterCount = normalizedDescription.codePointCount(0, normalizedDescription.length());
        if (characterCount <= DESCRIPTION_MAX_LENGTH) {
            return normalizedDescription;
        }

        return truncateText(normalizedDescription, DESCRIPTION_MAX_LENGTH);
    }

    private String truncateText(String value, int maxLength) {
        int characterCount = value.codePointCount(0, value.length());
        if (characterCount <= maxLength) {
            return value;
        }
        int contentLength = maxLength - 3;
        int endIndex = value.offsetByCodePoints(0, contentLength);
        return value.substring(0, endIndex).trim() + "...";
    }

    private ParsedRecommendation parseRecommendation(String rawReply, List<Costume> candidates) {
        Matcher matcher = RECOMMENDED_IDS_PATTERN.matcher(rawReply == null ? "" : rawReply);
        Set<Long> candidateIds = candidates.stream()
                .map(Costume::getId)
                .collect(Collectors.toSet());
        LinkedHashSet<Long> recommendedIds = new LinkedHashSet<>();

        while (matcher.find()) {
            for (String rawId : matcher.group(1).split(",")) {
                try {
                    Long costumeId = Long.valueOf(rawId.trim());
                    if (candidateIds.contains(costumeId)) {
                        recommendedIds.add(costumeId);
                    }
                } catch (NumberFormatException ignored) {
                    // Ignore malformed IDs and never expose a product outside the DB candidates.
                }
            }
        }

        String replyText = matcher.replaceAll("").trim();
        return new ParsedRecommendation(replyText, List.copyOf(recommendedIds));
    }

    private void saveAssistantMessage(ChatSession chatSession, String content, String recommendedCostumeIds) {
        chatMessageRepository.save(ChatMessage.builder()
                .chatSession(chatSession)
                .role(ChatMessageRole.ASSISTANT)
                .content(content)
                .recommendedCostumeIds(recommendedCostumeIds)
                .build());
    }

    private record ParsedRecommendation(String replyText, List<Long> costumeIds) {
    }

}
