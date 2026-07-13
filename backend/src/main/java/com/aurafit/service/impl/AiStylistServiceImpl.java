package com.aurafit.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.dto.ai.RecommendationReasoningInput;
import com.aurafit.dto.ai.RecommendationReasoningOutput;
import com.aurafit.dto.request.CreateAiStylistSessionRequest;
import com.aurafit.dto.request.SendAiStylistMessageRequest;
import com.aurafit.dto.response.AiStylistMessageDTO;
import com.aurafit.dto.response.AiStylistSessionAttachResponse;
import com.aurafit.dto.response.AiStylistSessionDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.CostumeMetadataDTO;
import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;
import com.aurafit.entity.AiStylistMessage;
import com.aurafit.entity.AiStylistSession;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.AiStylistMessageRole;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.OrderStatus;
import com.aurafit.exception.AiReasoningParseException;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.AiStylistSessionRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.RentalOrderDetailRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AiChatContext;
import com.aurafit.service.AiChatContextBuilder;
import com.aurafit.service.AiExplanationService;
import com.aurafit.service.AiIntentUnderstandingService;
import com.aurafit.service.AiStylistService;
import com.aurafit.service.RecommendationReasoningService;
import com.aurafit.service.UserPreferenceSummaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class AiStylistServiceImpl implements AiStylistService {

    private static final Logger logger = LoggerFactory.getLogger(AiStylistServiceImpl.class);

    private static final int RESPONSE_LIMIT = 3;
    private static final int HISTORY_EVENT_LIMIT = 60;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {
    };
    private static final Pattern BUDGET_WITH_UNIT_PATTERN =
            Pattern.compile("(?<![\\p{L}\\p{N}])(\\d{1,3}(?:[.,]\\d{3})+|\\d+(?:[.,]\\d+)?)\\s*(tr|trieu|k|nghin|ngan|vnd|dong|d)(?![\\p{L}\\p{N}])",
                    Pattern.CASE_INSENSITIVE);
    private static final Pattern GROUPED_BUDGET_PATTERN =
            Pattern.compile("(?<![\\p{L}\\p{N}])(\\d{1,3}(?:[.,]\\d{3})+)(?![\\p{L}\\p{N}])");
    private static final Pattern NORMALIZE_TEXT_PATTERN = Pattern.compile("[^\\p{L}\\p{N}\\s]");
    private static final Pattern VIETNAMESE_ACCENT_PATTERN = Pattern.compile("[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]", Pattern.CASE_INSENSITIVE);
    private static final Pattern NON_LATIN_SCRIPT_PATTERN = Pattern.compile("[\\p{IsHan}\\p{IsHiragana}\\p{IsKatakana}\\p{IsHangul}\\p{IsCyrillic}\\p{IsArabic}\\p{IsHebrew}\\p{IsThai}]");
    private static final Set<String> VI_LANGUAGE_HINTS = Set.of(
            "ao", "ban", "bo", "can", "cho", "co", "con", "costume", "de", "dip", "do", "goi", "gia",
            "hoi", "hang", "hop", "khoang", "mau", "minh", "muon", "ngan", "sach", "phu", "size", "su",
            "thue", "tim", "toi", "trang", "tu", "tuong", "ung", "vay", "voi", "yeu", "y"
    );
    private static final Set<String> EN_LANGUAGE_HINTS = Set.of(
            "a", "an", "budget", "color", "costume", "dress", "event", "for", "hello", "help", "hi", "i",
            "looking", "me", "my", "need", "outfit", "party", "please", "price", "recommend", "rental",
            "rent", "show", "size", "suggest", "suit", "thanks", "want", "wedding", "with"
    );
    private static final Set<String> LOW_SIGNAL_TOKENS = Set.of(
            "ban", "can", "cho", "co", "costume", "di", "do", "goi", "help", "looking", "minh", "muon",
            "need", "please", "recommend", "rent", "rental", "suggest", "thue", "tim", "toi", "trang",
            "tuong", "want", "voi"
    );
    private static final List<IntentSignalGroup> INTENT_SIGNAL_GROUPS = List.of(
            new IntentSignalGroup("formal_evening", Set.of(
                    "da hoi", "dam da hoi", "vay da hoi", "vay tiec", "dam tiec", "evening",
                    "evening dress", "formal", "formal wear", "gown", "prom", "prom dress",
                    "suit", "vest", "tuxedo", "black tie", "cocktail"
            )),
            new IntentSignalGroup("wedding", Set.of(
                    "dam cuoi", "di cuoi", "wedding", "bridesmaid", "cuoi hoi", "an hoi"
            )),
            new IntentSignalGroup("cosplay", Set.of(
                    "cosplay", "anime", "manga", "game", "fantasy", "hoa trang", "halloween", "character"
            )),
            new IntentSignalGroup("yearbook", Set.of(
                    "ky yeu", "yearbook", "graduation", "portrait"
            )),
            new IntentSignalGroup("photoshoot", Set.of(
                    "chup anh", "photoshoot", "couple", "concept"
            )),
            new IntentSignalGroup("office", Set.of(
                    "cong so", "office", "business", "interview"
            )),
            new IntentSignalGroup("traditional", Set.of(
                    "ao dai", "traditional", "truyen thong"
            )),
            new IntentSignalGroup("performance", Set.of(
                    "bieu dien", "performance", "stage", "dance"
            ))
    );
    private static final Set<String> CASUAL_CHAT_PHRASES = Set.of(
            "hi", "hello", "hey", "xin chao", "chao", "ban khoe khong", "khoe khong", "how are you",
            "ban la ai", "you are who", "who are you", "cam on", "thanks", "thank you", "good morning", "good evening"
    );
    private static final Set<String> CASUAL_THANKS_PHRASES = Set.of(
            "cam on", "thanks", "thank you", "thank u"
    );
    private static final Set<String> CASUAL_IDENTITY_PHRASES = Set.of(
            "ban la ai", "who are you", "you are who", "gioi thieu ve ban"
    );
    private static final Set<String> CASUAL_HEALTH_PHRASES = Set.of(
            "ban khoe khong", "khoe khong", "how are you", "how are u"
    );
    private static final Set<String> RENTAL_SUPPORT_PHRASES = Set.of(
            "thue nhu the nao", "dat coc", "coc", "deposit", "tra do", "return", "phi thue", "phi phat",
            "late fee", "giao hang", "delivery", "ship", "thanh toan", "payment", "chinh sach", "giu do"
    );
    private static final Set<String> PRODUCT_DETAIL_PHRASES = Set.of(
            "size", "mau", "color", "gia", "price", "con khong", "con hang", "available", "availability",
            "bao nhieu", "co mau", "co size", "san pham nay", "bo nay", "vay nay", "costume nay", "this product",
            "this costume", "this outfit"
    );
    private static final Set<String> PRODUCT_REFERENCE_PHRASES = Set.of(
            "san pham nay", "bo nay", "vay nay", "costume nay", "do nay", "item nay", "this product", "this costume", "this outfit"
    );
    private static final Set<String> RECOMMENDATION_REQUEST_PHRASES = Set.of(
            "goi y", "recommend", "recommendation", "suggest", "suggestion", "thue do", "chon do", "mac gi",
            "nen mac", "outfit", "phoi do", "party", "event", "prom", "cosplay", "ky yeu", "dam cuoi", "chup anh"
    );

    private final AiStylistSessionRepository aiStylistSessionRepository;
    private final CostumeRepository costumeRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final UserInteractionEventRepository userInteractionEventRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final AiProviderProperties aiProviderProperties;
    private final AiExplanationService aiExplanationService;
    private final AiIntentUnderstandingService aiIntentUnderstandingService;
    private final RecommendationReasoningService recommendationReasoningService;
    private final UserPreferenceSummaryService userPreferenceSummaryService;
    private final AiChatContextBuilder aiChatContextBuilder;

    public AiStylistServiceImpl(AiStylistSessionRepository aiStylistSessionRepository,
                                CostumeRepository costumeRepository,
                                RentalOrderDetailRepository rentalOrderDetailRepository,
                                UserInteractionEventRepository userInteractionEventRepository,
                                UserRepository userRepository,
                                ObjectMapper objectMapper,
                                AiProviderProperties aiProviderProperties,
                                AiExplanationService aiExplanationService,
                                AiIntentUnderstandingService aiIntentUnderstandingService,
                                RecommendationReasoningService recommendationReasoningService,
                                UserPreferenceSummaryService userPreferenceSummaryService,
                                AiChatContextBuilder aiChatContextBuilder) {
        this.aiStylistSessionRepository = aiStylistSessionRepository;
        this.costumeRepository = costumeRepository;
        this.rentalOrderDetailRepository = rentalOrderDetailRepository;
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.aiProviderProperties = aiProviderProperties;
        this.aiExplanationService = aiExplanationService;
        this.aiIntentUnderstandingService = aiIntentUnderstandingService;
        this.recommendationReasoningService = recommendationReasoningService;
        this.userPreferenceSummaryService = userPreferenceSummaryService;
        this.aiChatContextBuilder = aiChatContextBuilder;

        logger.info(
                "AI Stylist reasoning config loaded: aiEnabled={}, reasoningFlag={}, providerConfigured={}, reasoningRankingAvailable={}",
                aiProviderProperties != null && aiProviderProperties.isEnabled(),
                aiProviderProperties != null && aiProviderProperties.isReasoningRankingEnabled(),
                aiProviderProperties != null && aiProviderProperties.isProviderConfigured(),
                shouldUseReasoningRanking()
        );
        if (aiProviderProperties.isReasoningRankingEnabled() && !aiProviderProperties.isEnabled()) {
            logger.warn("AI reasoning ranking is enabled but AI_ENABLED is false. AI Stylist will keep using rule-based ranking.");
        }
    }

    @Override
    @Transactional
    public AiStylistSessionDTO createSession(CreateAiStylistSessionRequest request, String authenticatedEmail) {
        User authenticatedUser = resolveAuthenticatedUser(authenticatedEmail);
        String guestSessionId = normalize(request.guestSessionId());
        if (authenticatedUser == null && guestSessionId == null) {
            throw new BadRequestException("guestSessionId is required for guest AI Stylist sessions.");
        }

        Costume contextCostume = request.contextCostumeId() != null
                ? costumeRepository.findByIdWithItems(request.contextCostumeId())
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", request.contextCostumeId()))
                : null;

        AiStylistSession session = AiStylistSession.builder()
                .user(authenticatedUser)
                .guestSessionId(guestSessionId)
                .contextCostume(contextCostume)
                .build();

        addAssistantMessage(session, buildIntroMessage(contextCostume), null);
        AiStylistSession savedSession = aiStylistSessionRepository.save(session);

        return toSessionDTO(savedSession, buildActiveCostumeMap());
    }

    @Override
    @Transactional(readOnly = true)
    public AiStylistSessionDTO getSession(Long sessionId, String guestSessionId, String authenticatedEmail) {
        AiStylistSession session = loadAccessibleSession(sessionId, guestSessionId, authenticatedEmail);
        return toSessionDTO(session, buildActiveCostumeMap());
    }

    @Override
    @Transactional
    public AiStylistSessionDTO sendMessage(SendAiStylistMessageRequest request, String authenticatedEmail) {
        logger.info(
                "Received AI Stylist message request: sessionId={}, guestSessionId={}, selectedCostumeId={}, message={}",
                request.sessionId(),
                request.guestSessionId(),
                request.selectedCostumeId(),
                limitText(request.message(), 240)
        );
        AiStylistSession session = loadAccessibleSession(request.sessionId(), request.guestSessionId(), authenticatedEmail);
        String normalizedMessage = request.message().trim();
        Map<Long, Costume> activeCostumesById = buildActiveCostumeMap();
        AiChatContext chatContext = aiChatContextBuilder.build(session, normalizedMessage, activeCostumesById);
        AiIntentUnderstandingService.IntentUnderstandingResult understoodIntent =
                aiIntentUnderstandingService.understandIntent(chatContext);
        ReplyLanguage replyLanguage = mapReplyLanguage(understoodIntent.language());
        AvailabilityWindow availabilityWindow = resolveAvailabilityWindow(
                request.rentalStartDate(),
                request.rentalEndDate(),
                understoodIntent.rentalDate()
        );

        addUserMessage(session, normalizedMessage);

        AvailabilitySnapshot availabilitySnapshot = buildAvailabilitySnapshot(activeCostumesById.values(), availabilityWindow);
        Costume selectedCostume = resolveSelectedCostume(session, request.selectedCostumeId(), activeCostumesById);
        StylistIntent intent = buildStylistIntent(normalizedMessage, understoodIntent);
        ChatIntent chatIntent = mapChatIntent(understoodIntent.intent());

        if (chatIntent == ChatIntent.RECOMMENDATION_EXPLANATION_FOLLOW_UP) {
            List<SimilarCostumeRecommendationDTO> followUpRecommendations = chatContext.lastRecommendationDtos();
            String assistantContent = buildRecommendationFollowUpResponse(
                    normalizedMessage,
                    replyLanguage,
                    followUpRecommendations,
                    chatContext.lastUserNeedSummary()
            );
            addAssistantMessage(
                    session,
                    assistantContent,
                    writeAssistantMetadata(
                            followUpRecommendations,
                            toAvailabilityWindow(chatContext),
                            understoodIntent,
                            normalizedMessage,
                            assistantContent,
                            chatContext.lastUserNeedSummary()
                    )
            );
            AiStylistSession savedSession = aiStylistSessionRepository.save(session);
            return toSessionDTO(savedSession, activeCostumesById);
        }

        if (chatIntent != ChatIntent.RECOMMENDATION_REQUEST) {
            String assistantContent = buildDirectResponse(chatIntent, normalizedMessage, replyLanguage, selectedCostume, availabilitySnapshot, availabilityWindow, intent);
            addAssistantMessage(
                    session,
                    assistantContent,
                    writeAssistantMetadata(List.of(), availabilityWindow, understoodIntent, normalizedMessage, assistantContent, null)
            );
            AiStylistSession savedSession = aiStylistSessionRepository.save(session);
            return toSessionDTO(savedSession, activeCostumesById);
        }

        List<UserInteractionEvent> recentEvents = loadRecentEvents(session, request.guestSessionId(), authenticatedEmail);
        StylistPreferenceProfile preferenceProfile = buildPreferenceProfile(recentEvents, activeCostumesById);
        List<SimilarCostumeRecommendationDTO> recommendations;
        String assistantContent = null;
        Map<String, Object> metadataExtras = new LinkedHashMap<>();
        boolean useReasoningRanking = shouldUseReasoningRanking();

        logger.info(
                "reasoning flag={}, aiEnabled={}, providerConfigured={}, routing to={}",
                aiProviderProperties != null && aiProviderProperties.isReasoningRankingEnabled(),
                aiProviderProperties != null && aiProviderProperties.isEnabled(),
                aiProviderProperties != null && aiProviderProperties.isProviderConfigured(),
                useReasoningRanking ? "LLM" : "rule-based"
        );

        if (useReasoningRanking) {
            try {
                ReasoningCandidatePool reasoningCandidatePool = buildReasoningCandidatePool(
                        activeCostumesById.values(),
                        availabilitySnapshot,
                        intent
                );
                RecommendationReasoningOutput reasoningOutput = recommendationReasoningService.reason(
                        buildRecommendationReasoningInput(
                                normalizedMessage,
                                understoodIntent,
                                reasoningCandidatePool,
                                session,
                                request.guestSessionId(),
                                availabilityWindow
                        ),
                        RecommendationReasoningService.RecommendationReasoningMode.AI_STYLIST_CHAT,
                        buildReasoningActorKey(session, request.guestSessionId())
                );
                logger.info("AI Stylist reasoning call succeeded and returned output for sessionId={}", session.getId());
                metadataExtras.put("reasoningRankingMode", "llm");
                metadataExtras.put("llmReasoningUsed", true);
                metadataExtras.put("fallback", false);
                metadataExtras.put("llmReasoningOutput", objectMapper.convertValue(reasoningOutput, METADATA_TYPE));

                if (reasoningOutput.clarificationNeeded() != null) {
                    assistantContent = reasoningOutput.clarificationNeeded();
                    recommendations = List.of();
                    metadataExtras.put("awaitingClarification", true);
                    metadataExtras.put("clarificationNeeded", reasoningOutput.clarificationNeeded());
                } else if (reasoningOutput.noMatchReason() != null) {
                    assistantContent = reasoningOutput.noMatchReason();
                    recommendations = List.of();
                    metadataExtras.put("noMatchReason", reasoningOutput.noMatchReason());
                } else {
                    recommendations = mapReasoningRecommendations(reasoningOutput, reasoningCandidatePool, activeCostumesById);
                    assistantContent = buildAssistantMessage(
                            recommendations,
                            selectedCostume,
                            availabilityWindow,
                            !preferenceProfile.isEmpty(),
                            replyLanguage
                    );
                }
            } catch (Exception exception) {
                String correlationId = UUID.randomUUID().toString();
                String fallbackReason = resolveReasoningFallbackReason(exception);
                logger.warn(
                        "FALLBACK TRIGGERED: reason={}, correlationId={}, details={}",
                        fallbackReason,
                        correlationId,
                        summarize(exception)
                );
                logger.warn("Falling back to rule-based AI Stylist ranking for correlationId {} because LLM reasoning failed: {}",
                        correlationId, summarize(exception));
                metadataExtras.put("fallback", true);
                metadataExtras.put("reasoningRankingMode", "rule_based_fallback");
                metadataExtras.put("reasoningCorrelationId", correlationId);
                metadataExtras.put("reasoningFallbackReason", fallbackReason);
                metadataExtras.put("reasoningError", summarize(exception));
                recommendations = buildRuleBasedRecommendations(
                        normalizedMessage,
                        replyLanguage,
                        intent,
                        preferenceProfile,
                        selectedCostume,
                        activeCostumesById.values(),
                        availabilitySnapshot,
                        availabilityWindow,
                        understoodIntent.intentJson(),
                        chatContext
                );
            }
        } else {
            recommendations = buildRuleBasedRecommendations(
                    normalizedMessage,
                    replyLanguage,
                    intent,
                    preferenceProfile,
                    selectedCostume,
                    activeCostumesById.values(),
                    availabilitySnapshot,
                    availabilityWindow,
                    understoodIntent.intentJson(),
                    chatContext
            );
        }

        if (assistantContent == null) {
            assistantContent = buildAssistantMessage(
                    recommendations,
                    selectedCostume,
                    availabilityWindow,
                    !preferenceProfile.isEmpty(),
                    replyLanguage
            );
        }
        addAssistantMessage(
                session,
                assistantContent,
                writeAssistantMetadata(recommendations, availabilityWindow, understoodIntent, normalizedMessage, assistantContent, null, metadataExtras)
        );

        AiStylistSession savedSession = aiStylistSessionRepository.save(session);
        logger.info(
                "Completed AI Stylist message request: sessionId={}, fallback={}, recommendationCount={}, assistantContentPreview={}",
                savedSession.getId(),
                metadataExtras.get("fallback"),
                recommendations != null ? recommendations.size() : 0,
                limitText(assistantContent, 160)
        );
        return toSessionDTO(savedSession, activeCostumesById);
    }

    @Override
    @Transactional
    public AiStylistSessionAttachResponse attachGuestSessionsToUser(String guestSessionId, Long preferredSessionId, String authenticatedEmail) {
        User user = requireAuthenticatedUser(authenticatedEmail);
        String normalizedGuestSessionId = normalize(guestSessionId);
        if (normalizedGuestSessionId == null) {
            throw new BadRequestException("guestSessionId is required.");
        }

        List<AiStylistSession> guestSessions = aiStylistSessionRepository.findGuestSessionsForAttach(normalizedGuestSessionId);
        AiStylistSession latestExistingUserSession = aiStylistSessionRepository
                .findTopByUser_IdOrderByUpdatedAtDescIdDesc(user.getId())
                .orElse(null);

        AiStylistSession preferredAttachedSession = null;
        for (AiStylistSession guestSession : guestSessions) {
            guestSession.setUser(user);
            if (preferredSessionId != null && preferredSessionId.equals(guestSession.getId())) {
                preferredAttachedSession = guestSession;
            }
        }

        if (!guestSessions.isEmpty()) {
            aiStylistSessionRepository.saveAll(guestSessions);
        }

        if (preferredAttachedSession == null) {
            preferredAttachedSession = guestSessions.stream()
                    .max(this::compareSessionRecency)
                    .orElse(null);
        }

        if (preferredAttachedSession == null && preferredSessionId != null) {
            preferredAttachedSession = aiStylistSessionRepository
                    .findByIdAndUser_Id(preferredSessionId, user.getId())
                    .orElse(null);
        }

        AiStylistSession preferredSession = choosePreferredSession(latestExistingUserSession, preferredAttachedSession);
        return new AiStylistSessionAttachResponse(
                guestSessionId.trim(),
                guestSessions.size(),
                preferredSession != null ? preferredSession.getId() : null
        );
    }

    private AiStylistSession loadAccessibleSession(Long sessionId, String guestSessionId, String authenticatedEmail) {
        AiStylistSession session = aiStylistSessionRepository.findByIdWithMessages(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("AI Stylist session", "id", sessionId));

        User authenticatedUser = resolveAuthenticatedUser(authenticatedEmail);
        String normalizedGuestSessionId = normalize(guestSessionId);

        if (session.getUser() != null) {
            if (authenticatedUser == null || authenticatedUser.getId() == null || !authenticatedUser.getId().equals(session.getUser().getId())) {
                throw new BadRequestException("You cannot access this AI Stylist session.");
            }
            return session;
        }

        if (normalizedGuestSessionId == null || !normalizedGuestSessionId.equals(normalize(session.getGuestSessionId()))) {
            throw new BadRequestException("guestSessionId does not match this AI Stylist session.");
        }

        return session;
    }

    private Map<Long, Costume> buildActiveCostumeMap() {
        return costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE).stream()
                .collect(Collectors.toMap(Costume::getId, costume -> costume, (left, right) -> left, LinkedHashMap::new));
    }

    private Costume resolveSelectedCostume(AiStylistSession session,
                                           Long selectedCostumeId,
                                           Map<Long, Costume> activeCostumesById) {
        if (selectedCostumeId != null) {
            return activeCostumesById.get(selectedCostumeId);
        }

        if (session.getContextCostume() != null && session.getContextCostume().getId() != null) {
            return activeCostumesById.get(session.getContextCostume().getId());
        }

        return null;
    }

    private List<SimilarCostumeRecommendationDTO> buildRecommendations(String userMessage,
                                                                       ReplyLanguage replyLanguage,
                                                                       StylistIntent intent,
                                                                       StylistPreferenceProfile preferenceProfile,
                                                                       Costume selectedCostume,
                                                                       Collection<Costume> candidates,
                                                                       AvailabilitySnapshot availabilitySnapshot) {
        List<StylistCandidate> scoredCandidates = candidates.stream()
                .map(candidate -> buildStylistCandidate(candidate, replyLanguage, intent, preferenceProfile, selectedCostume, availabilitySnapshot))
                .filter(candidate -> candidate.availableItemCount() > 0)
                .filter(candidate -> candidate.score() > 0)
                .sorted(Comparator
                        .comparingInt(StylistCandidate::score).reversed()
                        .thenComparing(Comparator.comparingInt(StylistCandidate::availableItemCount).reversed())
                        .thenComparing(candidate -> candidate.costume().getId(), Comparator.reverseOrder()))
                .limit(RESPONSE_LIMIT)
                .toList();

        if (!scoredCandidates.isEmpty()) {
            return scoredCandidates.stream()
                    .map(candidate -> SimilarCostumeRecommendationDTO.fromEntity(
                            candidate.costume(),
                            candidate.reason(),
                            candidate.score(),
                            candidate.availableItemCount()
                    ))
                    .toList();
        }

        if (selectedCostume != null && looksLikeProductSpecificQuestion(userMessage)) {
            int availableItemCount = availabilitySnapshot.availableItemCount(selectedCostume, intent.requestedSizes());
            if (availableItemCount > 0) {
                return List.of(SimilarCostumeRecommendationDTO.fromEntity(
                        selectedCostume,
                        replyText(
                                replyLanguage,
                                "Đúng với costume bạn đang hỏi và còn sẵn để thuê",
                                "Matches the costume you're asking about and is currently available to rent"
                        ),
                        20 + availableItemCount,
                        availableItemCount
                ));
            }
        }

        return List.of();
    }

    private List<SimilarCostumeRecommendationDTO> buildRuleBasedRecommendations(String userMessage,
                                                                                ReplyLanguage replyLanguage,
                                                                                StylistIntent intent,
                                                                                StylistPreferenceProfile preferenceProfile,
                                                                                Costume selectedCostume,
                                                                                Collection<Costume> candidates,
                                                                                AvailabilitySnapshot availabilitySnapshot,
                                                                                AvailabilityWindow availabilityWindow,
                                                                                String detectedIntentJson,
                                                                                AiChatContext chatContext) {
        List<SimilarCostumeRecommendationDTO> recommendations = buildRecommendations(
                userMessage,
                replyLanguage,
                intent,
                preferenceProfile,
                selectedCostume,
                candidates,
                availabilitySnapshot
        );
        return aiExplanationService.enhanceRecommendationReasons(
                "ai_stylist_chat",
                buildAiStylistExplanationContext(
                        userMessage,
                        selectedCostume,
                        availabilityWindow,
                        !preferenceProfile.isEmpty(),
                        detectedIntentJson,
                        chatContext
                ),
                replyLanguage.providerCode(),
                limitText(userMessage, 220),
                detectedIntentJson,
                recommendations,
                chatContext
        );
    }

    private boolean shouldUseReasoningRanking() {
        return aiProviderProperties != null && aiProviderProperties.isReasoningRankingAvailable();
    }

    private RecommendationReasoningInput buildRecommendationReasoningInput(String userMessage,
                                                                           AiIntentUnderstandingService.IntentUnderstandingResult understoodIntent,
                                                                           ReasoningCandidatePool reasoningCandidatePool,
                                                                           AiStylistSession session,
                                                                           String fallbackGuestSessionId,
                                                                           AvailabilityWindow availabilityWindow) {
        return new RecommendationReasoningInput(
                userMessage,
                understoodIntent,
                reasoningCandidatePool.candidates(),
                buildUserPreferenceSummary(session, fallbackGuestSessionId),
                availabilityWindow == null
                        ? null
                        : new RecommendationReasoningInput.RentalDateRange(
                        availabilityWindow.startDate(),
                        availabilityWindow.endDate()
                )
        );
    }

    private ReasoningCandidatePool buildReasoningCandidatePool(Collection<Costume> candidates,
                                                               AvailabilitySnapshot availabilitySnapshot,
                                                               StylistIntent intent) {
        List<RecommendationReasoningInput.CandidateCostume> candidatePool = new ArrayList<>();
        Map<String, RecommendationReasoningInput.CandidateCostume> candidatesById = new LinkedHashMap<>();

        for (Costume candidate : candidates) {
            int availableItemCount = availabilitySnapshot.availableItemCount(candidate, intent.requestedSizes());
            if (availableItemCount <= 0 || candidate == null || candidate.getId() == null) {
                continue;
            }

            CostumeMetadataDTO metadata = CostumeMetadataDTO.fromEntity(candidate.getMetadata());
            RecommendationReasoningInput.CandidateCostume candidateRow = new RecommendationReasoningInput.CandidateCostume(
                    String.valueOf(candidate.getId()),
                    candidate.getName(),
                    limitText(candidate.getDescription(), 320),
                    candidate.getRentalPrice(),
                    candidate.getDepositPrice(),
                    metadata != null ? metadata.style() : null,
                    metadata != null ? metadata.occasion() : null,
                    metadata != null ? metadata.season() : null,
                    metadata != null ? metadata.color() : null,
                    candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                    metadata != null && metadata.tags() != null ? List.copyOf(metadata.tags()) : List.of(),
                    metadata != null ? metadata.skinTone() : null,
                    metadata != null ? metadata.bodyType() : null,
                    metadata != null ? metadata.material() : null,
                    metadata != null ? metadata.fitNote() : null,
                    metadata != null ? metadata.size() : null,
                    availableItemCount
            );
            candidatePool.add(candidateRow);
            candidatesById.put(candidateRow.id(), candidateRow);
        }

        return new ReasoningCandidatePool(List.copyOf(candidatePool), candidatesById);
    }

    private List<SimilarCostumeRecommendationDTO> mapReasoningRecommendations(RecommendationReasoningOutput reasoningOutput,
                                                                              ReasoningCandidatePool reasoningCandidatePool,
                                                                              Map<Long, Costume> activeCostumesById) {
        if (reasoningOutput == null || reasoningOutput.recommendations() == null || reasoningOutput.recommendations().isEmpty()) {
            throw new AiReasoningParseException("LLM reasoning did not return any recommendations.");
        }

        List<SimilarCostumeRecommendationDTO> recommendations = new ArrayList<>();
        Set<String> seenCostumeIds = new HashSet<>();
        for (RecommendationReasoningOutput.RecommendationItem recommendationItem : reasoningOutput.recommendations()) {
            if (recommendationItem == null || recommendationItem.costumeId() == null || !seenCostumeIds.add(recommendationItem.costumeId())) {
                continue;
            }

            RecommendationReasoningInput.CandidateCostume candidate = reasoningCandidatePool.candidatesById().get(recommendationItem.costumeId());
            Long costumeId = parseLong(recommendationItem.costumeId());
            Costume costume = costumeId == null ? null : activeCostumesById.get(costumeId);
            if (candidate == null || costume == null) {
                throw new AiReasoningParseException("LLM returned a costumeId outside the filtered candidate pool.");
            }

            recommendations.add(SimilarCostumeRecommendationDTO.fromEntity(
                    costume,
                    recommendationItem.reasoning(),
                    (int) Math.round(recommendationItem.confidenceScore() * 100.0d),
                    candidate.availableItemCount() != null ? candidate.availableItemCount() : 0
            ));
        }

        if (recommendations.isEmpty()) {
            throw new AiReasoningParseException("LLM reasoning did not return any usable recommendations.");
        }

        return recommendations;
    }

    private String buildUserPreferenceSummary(AiStylistSession session, String fallbackGuestSessionId) {
        if (userPreferenceSummaryService == null) {
            return null;
        }

        String userId = session != null && session.getUser() != null && session.getUser().getId() != null
                ? String.valueOf(session.getUser().getId())
                : null;
        String guestSessionId = normalize(session != null ? session.getGuestSessionId() : null);
        if (guestSessionId == null) {
            guestSessionId = normalize(fallbackGuestSessionId);
        }

        String summary = userPreferenceSummaryService.summarize(userId, guestSessionId);
        return summary == null || summary.isBlank() ? null : summary;
    }

    private String buildReasoningActorKey(AiStylistSession session, String fallbackGuestSessionId) {
        if (session != null && session.getUser() != null && session.getUser().getId() != null) {
            return "user:" + session.getUser().getId();
        }

        String guestSessionId = normalize(session != null ? session.getGuestSessionId() : null);
        if (guestSessionId == null) {
            guestSessionId = normalize(fallbackGuestSessionId);
        }
        return guestSessionId == null ? "guest:anonymous" : "guest:" + guestSessionId;
    }

    private StylistCandidate buildStylistCandidate(Costume candidate,
                                                   ReplyLanguage replyLanguage,
                                                   StylistIntent intent,
                                                   StylistPreferenceProfile preferenceProfile,
                                                   Costume selectedCostume,
                                                   AvailabilitySnapshot availabilitySnapshot) {
        int availableItemCount = availabilitySnapshot.availableItemCount(candidate, intent.requestedSizes());
        CostumeMetadataDTO candidateMetadata = CostumeMetadataDTO.fromEntity(candidate.getMetadata());
        int keywordMatchCount = countKeywordMatches(candidate, intent.tokens());
        IntentMatch intentMatch = evaluateLatestIntentMatch(candidate, candidateMetadata, intent);

        int score = keywordMatchCount * 4 + intentMatch.score();
        boolean inBudget = isInBudget(candidate, intent.maxBudget());
        if (inBudget) {
            score += 6;
        } else if (intent.maxBudget() != null) {
            score -= 4;
        }

        int historyCostumeScore = preferenceProfile.costumeScore(candidate.getId());
        int historyStyleScore = preferenceProfile.attributeScore(
                preferenceProfile.styles(),
                candidateMetadata != null ? candidateMetadata.style() : null,
                2
        );
        int historyOccasionScore = preferenceProfile.attributeScore(
                preferenceProfile.occasions(),
                candidateMetadata != null ? candidateMetadata.occasion() : null,
                2
        );
        int historySeasonScore = preferenceProfile.attributeScore(
                preferenceProfile.seasons(),
                candidateMetadata != null ? candidateMetadata.season() : null,
                1
        );
        int historyColorScore = preferenceProfile.attributeScore(
                preferenceProfile.colors(),
                candidateMetadata != null ? candidateMetadata.color() : null,
                2
        );
        int historyCategoryScore = preferenceProfile.attributeScore(
                preferenceProfile.categories(),
                candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                1
        );
        int historyTagScore = preferenceProfile.tagScore(candidateMetadata != null ? candidateMetadata.tags() : List.of(), 1, 8);
        int historyKeywordScore = preferenceProfile.keywordScore(candidate, 1, 8);
        int historyScore = historyCostumeScore
                + historyStyleScore
                + historyOccasionScore
                + historySeasonScore
                + historyColorScore
                + historyCategoryScore
                + historyTagScore
                + historyKeywordScore;
        if (intent.hasExplicitSignals() && !intentMatch.hasSignalMatch()) {
            historyScore = Math.min(historyScore, 4);
        }
        score += historyScore;

        boolean sameCategory = false;
        boolean sameStyle = false;
        boolean sameOccasion = false;
        boolean sameSeason = false;
        boolean sameColor = false;
        int sharedTags = 0;

        if (selectedCostume != null) {
            CostumeMetadataDTO selectedMetadata = CostumeMetadataDTO.fromEntity(selectedCostume.getMetadata());
            if (selectedCostume.getId() != null && selectedCostume.getId().equals(candidate.getId())) {
                score += 14;
            }

            sameCategory = selectedCostume.getCategory() != null
                    && candidate.getCategory() != null
                    && selectedCostume.getCategory().getId() != null
                    && selectedCostume.getCategory().getId().equals(candidate.getCategory().getId());
            sameStyle = equalsIgnoreCase(selectedMetadata != null ? selectedMetadata.style() : null,
                    candidateMetadata != null ? candidateMetadata.style() : null);
            sameOccasion = equalsIgnoreCase(selectedMetadata != null ? selectedMetadata.occasion() : null,
                    candidateMetadata != null ? candidateMetadata.occasion() : null);
            sameSeason = equalsIgnoreCase(selectedMetadata != null ? selectedMetadata.season() : null,
                    candidateMetadata != null ? candidateMetadata.season() : null);
            sameColor = equalsIgnoreCase(selectedMetadata != null ? selectedMetadata.color() : null,
                    candidateMetadata != null ? candidateMetadata.color() : null);
            sharedTags = countSharedTags(
                    selectedMetadata != null ? selectedMetadata.tags() : List.of(),
                    candidateMetadata != null ? candidateMetadata.tags() : List.of()
            );

            if (sameCategory) {
                score += 5;
            }
            if (sameStyle) {
                score += 8;
            }
            if (sameOccasion) {
                score += 6;
            }
            if (sameSeason) {
                score += 4;
            }
            if (sameColor) {
                score += 3;
            }
            score += sharedTags * 2;
        }

        boolean sizeMatched = !intent.requestedSizes().isEmpty();
        if (sizeMatched) {
            score += 4;
        }

        score += Math.min(availableItemCount, 3);

        String reason = buildStylistReason(
                candidate,
                replyLanguage,
                selectedCostume,
                intent,
                intentMatch,
                keywordMatchCount,
                inBudget,
                sameCategory,
                sameStyle,
                sameOccasion,
                sameSeason,
                sameColor,
                sharedTags,
                historyCostumeScore,
                historyStyleScore,
                historyOccasionScore,
                historyColorScore,
                historyTagScore,
                historyKeywordScore,
                sizeMatched
        );
        return new StylistCandidate(candidate, score, availableItemCount, reason);
    }

    private String buildStylistReason(Costume candidate,
                                      ReplyLanguage replyLanguage,
                                      Costume selectedCostume,
                                      StylistIntent intent,
                                      IntentMatch intentMatch,
                                      int keywordMatchCount,
                                      boolean inBudget,
                                      boolean sameCategory,
                                      boolean sameStyle,
                                      boolean sameOccasion,
                                      boolean sameSeason,
                                      boolean sameColor,
                                      int sharedTags,
                                      int historyCostumeScore,
                                      int historyStyleScore,
                                      int historyOccasionScore,
                                      int historyColorScore,
                                      int historyTagScore,
                                      int historyKeywordScore,
                                      boolean sizeMatched) {
        if (selectedCostume != null && selectedCostume.getId() != null && selectedCostume.getId().equals(candidate.getId())) {
            return replyText(
                    replyLanguage,
                    "Đúng với costume bạn đang hỏi và còn sẵn để thuê",
                    "Matches the costume you're asking about and is currently available to rent"
            );
        }
        if (intentMatch.hasSignalMatch() && intentMatch.signalMatchCount() >= 2) {
            return replyText(
                    replyLanguage,
                    "Khớp rất sát với nhu cầu hiện tại bạn vừa mô tả",
                    "Closely matches the current occasion or style you just described"
            );
        }
        if (intentMatch.hasSignalMatch()) {
            return replyText(
                    replyLanguage,
                    "Khớp với nhu cầu hiện tại bạn vừa nói",
                    "Matches the latest need you just mentioned"
            );
        }
        if (keywordMatchCount > 0 && inBudget) {
            return replyText(
                    replyLanguage,
                    "Khớp với nhu cầu hiện tại và vẫn nằm trong tầm giá của bạn",
                    "Matches your current need and still fits your budget"
            );
        }
        if (sizeMatched) {
            return replyLanguage.isVietnamese()
                    ? "Có size " + String.join("/", intent.requestedSizes()) + " đang sẵn để thuê"
                    : "Available right now in size " + String.join("/", intent.requestedSizes());
        }
        if (historyCostumeScore > 0) {
            return replyText(
                    replyLanguage,
                    "Gần với costume bạn đã xem hoặc tương tác gần đây",
                    "Close to a costume you've viewed or interacted with recently"
            );
        }
        if (sameStyle && sameOccasion) {
            return replyText(
                    replyLanguage,
                    "Cùng style và đúng dịp sử dụng bạn đang quan tâm",
                    "Matches both the style and occasion you're looking for"
            );
        }
        if (historyStyleScore > 0 && historyOccasionScore > 0) {
            return replyText(
                    replyLanguage,
                    "Gần với phong cách và dịp sử dụng bạn thường tìm",
                    "Close to the style and occasion you usually browse"
            );
        }
        if (historyStyleScore > 0) {
            return replyText(
                    replyLanguage,
                    "Gần với phong cách bạn thường xem gần đây",
                    "Close to the style you've viewed recently"
            );
        }
        if (historyOccasionScore > 0 || historyColorScore > 0) {
            return replyText(
                    replyLanguage,
                    "Phù hợp với nhu cầu bạn đã tìm hoặc xem gần đây",
                    "Fits what you've recently searched for or viewed"
            );
        }
        if (sameCategory && sharedTags > 0) {
            return replyText(
                    replyLanguage,
                    "Cùng nhóm sản phẩm và có tag gần với nhu cầu hiện tại",
                    "In the same product group with tags close to your current need"
            );
        }
        if (historyTagScore > 0 || historyKeywordScore > 0) {
            return replyText(
                    replyLanguage,
                    "Liên quan đến hành vi tìm kiếm gần đây của bạn",
                    "Related to your recent search behavior"
            );
        }
        if (sameStyle) {
            return replyText(
                    replyLanguage,
                    "Cùng style với ngữ cảnh bạn đang xem",
                    "Matches the style of the context you're viewing"
            );
        }
        if (sameOccasion || sameSeason || sameColor) {
            return replyText(
                    replyLanguage,
                    "Metadata phù hợp với nhu cầu bạn vừa mô tả",
                    "Its metadata fits the need you just described"
            );
        }
        if (sameCategory) {
            return replyText(
                    replyLanguage,
                    "Cùng danh mục và còn sẵn để thuê",
                    "In the same category and still available to rent"
            );
        }
        if (inBudget) {
            return replyText(
                    replyLanguage,
                    "Còn sẵn để thuê và nằm trong tầm giá bạn đưa ra",
                    "Currently available and within the budget you mentioned"
            );
        }
        if (keywordMatchCount > 0) {
            return replyText(
                    replyLanguage,
                    "Liên quan đến từ khóa bạn vừa nhập",
                    "Related to the keywords you just entered"
            );
        }
        return replyText(
                replyLanguage,
                "Còn sẵn để thuê trong catalog hiện tại",
                "Currently available in the live catalog"
        );
    }

    private String buildAssistantMessage(List<SimilarCostumeRecommendationDTO> recommendations,
                                         Costume selectedCostume,
                                         AvailabilityWindow availabilityWindow,
                                         boolean usedBehaviorProfile,
                                         ReplyLanguage replyLanguage) {
        if (recommendations.isEmpty()) {
            return replyText(
                    replyLanguage,
                    "Mình chưa tìm thấy costume phù hợp hoặc còn sẵn từ nội dung hiện tại. Bạn hãy nói rõ hơn về dịp sử dụng, style, màu sắc, ngân sách, size hoặc chọn một costume cụ thể để mình lọc hẹp hơn.",
                    "I couldn't find a suitable costume that's currently available from your current request. Tell me more about the occasion, style, color, budget, size, or a specific costume so I can narrow it down."
            );
        }

        String dateContext = availabilityWindow != null
                ? (replyLanguage.isVietnamese()
                ? " trong khoảng ngày " + formatAvailabilityWindowVi(availabilityWindow)
                : " for " + formatAvailabilityWindowEn(availabilityWindow))
                : "";
        String recommendationSummary = recommendations.stream()
                .map(item -> item.costume().name() + " (" + formatPrice(item.costume().rentalPrice(), replyLanguage) + ") - " + item.reason())
                .collect(Collectors.joining(replyLanguage.isVietnamese() ? "; " : "; "));

        if (replyLanguage.isVietnamese()) {
            String catalogContext = selectedCostume != null
                    ? " Mình đang ưu tiên các lựa chọn gần với costume bạn đang xem."
                    : "";
            String behaviorContext = usedBehaviorProfile
                    ? " Mình chỉ dùng thêm hành vi bạn đã xem và tìm gần đây để cá nhân hóa trong các lựa chọn đã khớp nhu cầu hiện tại."
                    : "";
            return "Mình đã đối chiếu với catalog đang có và chỉ giữ lại các costume còn sẵn để thuê" + dateContext + "." +
                    catalogContext +
                    behaviorContext +
                    " Gợi ý phù hợp nhất hiện tại: " + recommendationSummary +
                    ". Nếu cần lọc tiếp, bạn có thể bổ sung ngân sách, size, màu sắc hoặc dịp sử dụng.";
        }

        String catalogContext = selectedCostume != null
                ? " I'm prioritizing options close to the costume you're viewing."
                : "";
        String behaviorContext = usedBehaviorProfile
                ? " I only used your recent behavior to personalize among the options that already match your current need."
                : "";
        return "I checked the live catalog and kept only the costumes that are currently available to rent" + dateContext + "." +
                catalogContext +
                behaviorContext +
                " The best matches right now are: " + recommendationSummary +
                ". If you want me to narrow it down further, add your budget, size, color, or occasion.";
    }

    private String buildDirectResponse(ChatIntent chatIntent,
                                       String userMessage,
                                       ReplyLanguage replyLanguage,
                                       Costume selectedCostume,
                                       AvailabilitySnapshot availabilitySnapshot,
                                       AvailabilityWindow availabilityWindow,
                                       StylistIntent intent) {
        return switch (chatIntent) {
            case CASUAL_CHAT -> buildCasualChatResponse(userMessage, replyLanguage);
            case RENTAL_SUPPORT -> buildRentalSupportResponse(userMessage, replyLanguage);
            case PRODUCT_QUESTION -> buildProductQuestionResponse(userMessage, replyLanguage, selectedCostume, availabilitySnapshot, availabilityWindow, intent);
            case RECOMMENDATION_EXPLANATION_FOLLOW_UP -> buildRecommendationFollowUpFallbackResponse(replyLanguage);
            case OUT_OF_SCOPE -> buildOutOfScopeResponse(replyLanguage);
            case RECOMMENDATION_REQUEST -> replyText(
                    replyLanguage,
                    "Mình đang xử lý yêu cầu gợi ý trang phục của bạn.",
                    "I'm preparing outfit recommendations for you."
            );
        };
    }

    private String buildCasualChatResponse(String userMessage, ReplyLanguage replyLanguage) {
        String normalizedMessage = normalizeForLanguageDetection(userMessage);
        if (normalizedMessage == null) {
            return replyText(
                    replyLanguage,
                    "Mình luôn sẵn sàng giúp bạn chọn trang phục phù hợp. Hôm nay bạn đang cần đồ cho dịp nào?",
                    "I'm ready to help you find the right outfit. What occasion are you shopping for today?"
            );
        }

        if (containsAnyPhrase(normalizedMessage, CASUAL_THANKS_PHRASES)) {
            return replyText(
                    replyLanguage,
                    "Không có gì. Mình luôn sẵn sàng giúp bạn chọn trang phục phù hợp. Nếu muốn, bạn có thể nói luôn dịp sử dụng để mình tư vấn tiếp.",
                    "You're welcome. I'm always ready to help you choose the right outfit. If you'd like, tell me the occasion and I'll help from there."
            );
        }
        if (containsAnyPhrase(normalizedMessage, CASUAL_IDENTITY_PHRASES)) {
            return replyText(
                    replyLanguage,
                    "Mình là AuraFit AI Stylist. Mình có thể hỗ trợ bạn chọn trang phục, giải thích lựa chọn phù hợp và trả lời các câu hỏi cơ bản về thuê đồ.",
                    "I'm AuraFit AI Stylist. I can help you choose outfits, explain suitable options, and answer basic costume rental questions."
            );
        }
        if (containsAnyPhrase(normalizedMessage, CASUAL_HEALTH_PHRASES)) {
            return replyText(
                    replyLanguage,
                    "Mình vẫn ổn và sẵn sàng giúp bạn chọn trang phục phù hợp. Hôm nay bạn đang tìm đồ cho dịp nào?",
                    "I'm doing well and ready to help you find the right outfit. What occasion are you dressing for today?"
            );
        }
        return replyText(
                replyLanguage,
                "Chào bạn, mình luôn sẵn sàng hỗ trợ chọn trang phục phù hợp. Bạn đang cần đồ cho dịp nào?",
                "Hello, I'm ready to help with outfit suggestions. What occasion are you shopping for?"
        );
    }

    private String buildRentalSupportResponse(String userMessage, ReplyLanguage replyLanguage) {
        String normalizedMessage = normalizeForLanguageDetection(userMessage);
        if (normalizedMessage == null) {
            return replyText(
                    replyLanguage,
                    "Mình có thể hỗ trợ các câu hỏi cơ bản về quy trình thuê đồ. Bạn muốn hỏi về đặt cọc, thanh toán, giao hàng hay trả đồ?",
                    "I can help with basic rental process questions. Are you asking about deposit, payment, delivery, or returns?"
            );
        }

        if (normalizedMessage.contains("dat coc") || normalizedMessage.contains("coc") || normalizedMessage.contains("deposit")) {
            return replyText(
                    replyLanguage,
                    "Thông tin đặt cọc còn tùy từng sản phẩm và chính sách vận hành hiện tại. Nếu backend chưa hiển thị rõ mức cọc, mình chưa thể cam kết cụ thể, nên bạn hãy kiểm tra ở trang sản phẩm hoặc xác nhận lại với shop trước khi chốt đơn nhé.",
                    "Deposit details can vary by product and current shop policy. If the backend doesn't show a clear deposit amount yet, I can't confirm a specific number, so please check the product page or confirm with the shop before placing the order."
            );
        }
        if (normalizedMessage.contains("tra do") || normalizedMessage.contains("return") || normalizedMessage.contains("phi phat") || normalizedMessage.contains("late fee")) {
            return replyText(
                    replyLanguage,
                    "Bạn nên trả đồ đúng hạn và kiểm tra lại chính sách phí phạt hoặc xử lý trả trễ với shop. Nếu hệ thống chưa xác nhận mức phí cụ thể, mình chỉ có thể khuyên bạn liên hệ shop để được chốt thông tin chính xác.",
                    "It's best to return the costume on time and confirm any late return fee policy with the shop. If the system doesn't expose a specific fee yet, I can only recommend checking directly with the shop for exact details."
            );
        }
        if (normalizedMessage.contains("giao hang") || normalizedMessage.contains("delivery") || normalizedMessage.contains("ship")) {
            return replyText(
                    replyLanguage,
                    "Việc giao hàng hoặc nhận tại shop còn phụ thuộc chính sách vận hành hiện tại. Bạn nên kiểm tra thông tin giao nhận trong luồng đặt thuê hoặc xác nhận trực tiếp với shop để chắc chắn nhé.",
                    "Delivery or store pickup depends on the current operating policy. Please check the rental flow details or confirm directly with the shop to be sure."
            );
        }
        if (normalizedMessage.contains("thanh toan") || normalizedMessage.contains("payment")) {
            return replyText(
                    replyLanguage,
                    "Phương thức thanh toán cụ thể có thể thay đổi theo quy trình hiện hành của shop. Nếu màn hình đặt thuê chưa hiện rõ, bạn nên kiểm tra lại ở bước checkout hoặc hỏi shop để xác nhận cách thanh toán phù hợp.",
                    "Payment methods can vary based on the shop's current checkout process. If the rental flow doesn't show it clearly yet, please recheck the checkout step or confirm with the shop."
            );
        }
        return replyText(
                replyLanguage,
                "Với câu hỏi về quy trình thuê, mình có thể hỗ trợ ở mức chung: bạn nên kiểm tra ngày thuê, ngày trả, size, tình trạng sản phẩm và xác nhận lại các chính sách như giữ đồ, đặt cọc hoặc giao hàng nếu hệ thống chưa hiển thị rõ.",
                "For rental process questions, I can help at a general level: check the rental dates, return date, size, product condition, and confirm any hold, deposit, or delivery policy if the system doesn't show it clearly yet."
        );
    }

    private String buildProductQuestionResponse(String userMessage,
                                                ReplyLanguage replyLanguage,
                                                Costume selectedCostume,
                                                AvailabilitySnapshot availabilitySnapshot,
                                                AvailabilityWindow availabilityWindow,
                                                StylistIntent intent) {
        if (selectedCostume == null) {
            return replyText(
                    replyLanguage,
                    "Mình cần bạn chọn đúng sản phẩm hoặc gửi rõ tên costume thì mới kiểm tra size, màu, giá hay tình trạng còn hàng chính xác được.",
                    "I need you to open the exact product or send the costume name so I can check size, color, price, or availability accurately."
            );
        }

        String normalizedMessage = normalizeForLanguageDetection(userMessage);
        int availableItemCount = availabilitySnapshot.availableItemCount(selectedCostume, intent.requestedSizes());
        Set<String> availableSizes = extractAvailableValues(selectedCostume, availabilitySnapshot, CostumeItem::getSize);
        Set<String> availableColors = extractAvailableValues(selectedCostume, availabilitySnapshot, CostumeItem::getColor);
        String dateContext = availabilityWindow != null
                ? replyText(replyLanguage,
                " trong khoảng " + formatAvailabilityWindowVi(availabilityWindow),
                " for " + formatAvailabilityWindowEn(availabilityWindow))
                : "";

        if (normalizedMessage != null && normalizedMessage.contains("size")) {
            if (!intent.requestedSizes().isEmpty()) {
                String requestedSizeLabel = String.join("/", intent.requestedSizes());
                if (availableItemCount > 0) {
                    return replyText(
                            replyLanguage,
                            "Costume này hiện còn size " + requestedSizeLabel + dateContext + ". Bạn có thể tiếp tục kiểm tra ngày thuê hoặc chốt lựa chọn nếu phù hợp.",
                            "This costume is currently available in size " + requestedSizeLabel + dateContext + ". You can keep checking the rental dates or move forward if it fits."
                    );
                }
                return replyText(
                        replyLanguage,
                        "Mình chưa thấy size " + requestedSizeLabel + " còn sẵn" + dateContext + ". Các size đang dễ kiểm tra nhất là: " + joinValuesOrFallback(availableSizes, replyLanguage) + ".",
                        "I can't see size " + requestedSizeLabel + " available" + dateContext + ". The sizes I can confirm more safely right now are: " + joinValuesOrFallback(availableSizes, replyLanguage) + "."
                );
            }
            return replyText(
                    replyLanguage,
                    "Các size mình kiểm tra được cho costume này là: " + joinValuesOrFallback(availableSizes, replyLanguage) + ".",
                    "The sizes I can check for this costume are: " + joinValuesOrFallback(availableSizes, replyLanguage) + "."
            );
        }

        if (normalizedMessage != null && (normalizedMessage.contains("mau") || normalizedMessage.contains("color"))) {
            return replyText(
                    replyLanguage,
                    "Màu mình kiểm tra được cho costume này là: " + joinValuesOrFallback(availableColors, replyLanguage) + ".",
                    "The colors I can check for this costume are: " + joinValuesOrFallback(availableColors, replyLanguage) + "."
            );
        }

        if (normalizedMessage != null && (normalizedMessage.contains("gia") || normalizedMessage.contains("price") || normalizedMessage.contains("bao nhieu"))) {
            return replyText(
                    replyLanguage,
                    "Giá thuê hiện tại của costume này là " + formatPrice(selectedCostume.getRentalPrice(), replyLanguage) + ".",
                    "The current rental price for this costume is " + formatPrice(selectedCostume.getRentalPrice(), replyLanguage) + "."
            );
        }

        if (normalizedMessage != null && (normalizedMessage.contains("con khong") || normalizedMessage.contains("con hang") || normalizedMessage.contains("available") || normalizedMessage.contains("availability"))) {
            if (availableItemCount > 0) {
                return replyText(
                        replyLanguage,
                        "Costume này hiện vẫn còn sẵn để thuê" + dateContext + ".",
                        "This costume is still available to rent" + dateContext + "."
                );
            }
            return replyText(
                    replyLanguage,
                    "Hiện mình chưa thấy costume này còn sẵn" + dateContext + ". Bạn có thể đổi ngày thuê hoặc mình hỗ trợ tìm mẫu gần nhất.",
                    "I can't currently see this costume available" + dateContext + ". You can change the rental dates, or I can help find the closest alternative."
            );
        }

        return replyText(
                replyLanguage,
                "Mình đang thấy costume \"" + selectedCostume.getName() + "\" có giá thuê " + formatPrice(selectedCostume.getRentalPrice(), replyLanguage)
                        + ", size khả dụng: " + joinValuesOrFallback(availableSizes, replyLanguage)
                        + ", màu khả dụng: " + joinValuesOrFallback(availableColors, replyLanguage) + ".",
                "For \"" + selectedCostume.getName() + "\", I can currently confirm the rental price is " + formatPrice(selectedCostume.getRentalPrice(), replyLanguage)
                        + ", available sizes: " + joinValuesOrFallback(availableSizes, replyLanguage)
                        + ", available colors: " + joinValuesOrFallback(availableColors, replyLanguage) + "."
        );
    }

    private String buildRecommendationFollowUpResponse(String userMessage,
                                                       ReplyLanguage replyLanguage,
                                                       List<SimilarCostumeRecommendationDTO> previousRecommendations,
                                                       String lastUserNeedSummary) {
        if (previousRecommendations == null || previousRecommendations.isEmpty()) {
            return buildRecommendationFollowUpFallbackResponse(replyLanguage);
        }

        String normalizedMessage = normalizeForLanguageDetection(userMessage);
        if (normalizedMessage != null && isBestChoiceFollowUp(normalizedMessage)) {
            SimilarCostumeRecommendationDTO bestMatch = previousRecommendations.get(0);
            return replyText(
                    replyLanguage,
                    bestMatch.costume().name() + " là lựa chọn hợp nhất lúc này vì "
                            + buildSingleRecommendationExplanation(bestMatch, lastUserNeedSummary, replyLanguage, false)
                            + ". Nếu bạn muốn, mình có thể so sánh tiếp với các mẫu còn lại.",
                    bestMatch.costume().name() + " is the strongest match right now because "
                            + buildSingleRecommendationExplanation(bestMatch, lastUserNeedSummary, replyLanguage, false)
                            + ". If you'd like, I can also compare it against the other suggestions."
            );
        }

        if (normalizedMessage != null && isComparisonFollowUp(normalizedMessage)) {
            String comparison = previousRecommendations.stream()
                    .limit(3)
                    .map(item -> item.costume().name() + ": " + buildSingleRecommendationExplanation(item, lastUserNeedSummary, replyLanguage, false))
                    .collect(Collectors.joining(replyLanguage.isVietnamese() ? "; " : "; "));
            return replyText(
                    replyLanguage,
                    "Nếu so sánh nhanh các mẫu vừa gợi ý: " + comparison + ". Nếu bạn muốn chốt một mẫu, mình có thể chọn giúp phương án hợp nhất.",
                    "If I compare the previous suggestions quickly: " + comparison + ". If you want to narrow it down to one, I can help choose the best fit."
            );
        }

        String explanation = previousRecommendations.stream()
                .limit(3)
                .map(item -> item.costume().name() + ": " + buildSingleRecommendationExplanation(item, lastUserNeedSummary, replyLanguage, true))
                .collect(Collectors.joining(replyLanguage.isVietnamese() ? "; " : "; "));
        return replyText(
                replyLanguage,
                "Các mẫu mình vừa gợi ý phù hợp vì " + explanation + ". Nếu bạn muốn, mình có thể so sánh kỹ hơn hoặc chọn ra mẫu hợp nhất.",
                "The previous suggestions fit because " + explanation + ". If you want, I can compare them in more detail or choose the strongest option."
        );
    }

    private String buildSingleRecommendationExplanation(SimilarCostumeRecommendationDTO recommendation,
                                                        String lastUserNeedSummary,
                                                        ReplyLanguage replyLanguage,
                                                        boolean capitalize) {
        CostumeDTO costume = recommendation.costume();
        CostumeMetadataDTO metadata = costume != null ? costume.metadata() : null;
        String needSummary = normalizeForLanguageDetection(lastUserNeedSummary);
        List<String> reasons = new ArrayList<>();

        if (needSummary != null) {
            if (needSummary.contains("wedding")) {
                reasons.add(replyText(replyLanguage, "hợp với nhu cầu đi tiệc cưới", "it fits a wedding occasion"));
            } else if (needSummary.contains("prom")) {
                reasons.add(replyText(replyLanguage, "đúng tinh thần prom", "it matches a prom occasion"));
            } else if (needSummary.contains("gala")) {
                reasons.add(replyText(replyLanguage, "phù hợp với không khí dạ hội", "it suits a formal evening occasion"));
            }

            if (needSummary.contains("formal")) {
                reasons.add(replyText(replyLanguage, "giữ tổng thể lịch sự và trang trọng", "it keeps the overall look formal and polished"));
            } else if (needSummary.contains("elegant")) {
                reasons.add(replyText(replyLanguage, "giữ cảm giác thanh lịch", "it keeps the look elegant"));
            }
        }

        if (metadata != null) {
            if (metadata.style() != null && normalize(metadata.style()).contains("elegant")) {
                reasons.add(replyText(replyLanguage, "form và style thiên về thanh lịch", "its style leans elegant"));
            } else if (metadata.style() != null && normalize(metadata.style()).contains("traditional")) {
                reasons.add(replyText(replyLanguage, "có style chỉn chu và dễ mặc", "its style is polished and easy to wear"));
            }

            if (metadata.occasion() != null) {
                String normalizedOccasion = normalize(metadata.occasion());
                if (normalizedOccasion.contains("wedding") || normalizedOccasion.contains("gala") || normalizedOccasion.contains("prom")) {
                    reasons.add(replyText(replyLanguage, "occasion của mẫu này khá sát nhu cầu", "its occasion metadata is close to your need"));
                }
            }

            if (metadata.color() != null) {
                String normalizedColor = normalize(metadata.color());
                if ("black".equals(normalizedColor) || "silver".equals(normalizedColor) || "white".equals(normalizedColor) || "gray".equals(normalizedColor)) {
                    reasons.add(replyText(replyLanguage, "màu dễ phối và an toàn khi dự tiệc", "the color is easy to style for an event"));
                }
            }
        }

        if (recommendation.reason() != null && !recommendation.reason().isBlank()) {
            reasons.add(replyText(
                    replyLanguage,
                    "backend cũng đã chấm mẫu này cao vì " + decapitalize(recommendation.reason()),
                    "the backend also ranked it highly because " + decapitalize(recommendation.reason())
            ));
        }

        if (reasons.isEmpty()) {
            reasons.add(replyText(
                    replyLanguage,
                    "nó là một trong các lựa chọn khớp nhất với nhu cầu trước đó của bạn",
                    "it was one of the closest matches to your previous need"
            ));
        }

        String joined = String.join(replyLanguage.isVietnamese() ? ", " : ", ", reasons.stream().distinct().limit(3).toList());
        return capitalize ? capitalizeFirst(joined) : joined;
    }

    private boolean isBestChoiceFollowUp(String normalizedMessage) {
        return normalizedMessage.contains("cai nao hop nhat")
                || normalizedMessage.contains("cai nao nen chon")
                || normalizedMessage.contains("mau nao nen chon")
                || normalizedMessage.contains("which one is best")
                || normalizedMessage.contains("which one best")
                || normalizedMessage.contains("which one should i choose")
                || normalizedMessage.contains("best one");
    }

    private boolean isComparisonFollowUp(String normalizedMessage) {
        return normalizedMessage.contains("so sanh")
                || normalizedMessage.contains("compare");
    }

    private String buildRecommendationFollowUpFallbackResponse(ReplyLanguage replyLanguage) {
        return replyText(
                replyLanguage,
                "Mình hiểu bạn đang hỏi tiếp về các mẫu vừa gợi ý. Hiện mình chưa giữ đủ danh sách recommendation trước đó trong ngữ cảnh này, nên bạn hãy gửi lại tên các mẫu hoặc yêu cầu mình gợi ý lại để mình giải thích chính xác hơn.",
                "I understand you're following up on the previous suggestions. I don't have a reliable list of those recommendations in this context right now, so please send the item names again or let me recommend them again and I'll explain more precisely."
        );
    }

    private String buildOutOfScopeResponse(ReplyLanguage replyLanguage) {
        return replyText(
                replyLanguage,
                "Mình chủ yếu hỗ trợ chọn trang phục và giải đáp các câu hỏi liên quan đến thuê đồ. Nếu bạn muốn, mình có thể giúp gợi ý outfit hoặc kiểm tra thông tin thuê phù hợp.",
                "I mainly help with outfit selection and costume rental questions. If you'd like, I can help suggest an outfit or check rental-related details."
        );
    }

    private String buildIntroMessage(Costume contextCostume) {
        if (contextCostume != null) {
            return "AI Stylist đã sẵn sàng. Bạn có thể hỏi về style, dịp sử dụng, màu sắc, ngân sách, size hoặc yêu cầu sản phẩm tương tự với \"" + contextCostume.getName() + "\".";
        }

        return "AI Stylist đã sẵn sàng. Hãy cho mình biết dịp sử dụng, style, màu sắc, ngân sách, size hoặc costume bạn đang quan tâm để mình đề xuất từ catalog thực tế.";
    }

    private String buildAiStylistExplanationContext(String userMessage,
                                                    Costume selectedCostume,
                                                    AvailabilityWindow availabilityWindow,
                                                    boolean usedBehaviorProfile,
                                                    String detectedIntentJson,
                                                    AiChatContext chatContext) {
        StringBuilder context = new StringBuilder("AI stylist recommendations grounded in the live catalog.");
        if (selectedCostume != null) {
            context.append(" Reference costume: ").append(selectedCostume.getName()).append('.');
        }
        if (availabilityWindow != null) {
            context.append(" Rental availability window: ")
                    .append(formatAvailabilityWindowEn(availabilityWindow))
                    .append('.');
        }
        if (usedBehaviorProfile) {
            context.append(" Recent behavior signals were also used.");
        }
        if (detectedIntentJson != null && !detectedIntentJson.isBlank()) {
            context.append(" Detected intent JSON: ").append(detectedIntentJson);
        }
        if (chatContext != null && chatContext.conversationSummary() != null && !chatContext.conversationSummary().isBlank()) {
            context.append(" Conversation summary: ").append(chatContext.conversationSummary());
        }
        if (userMessage != null && !userMessage.isBlank()) {
            context.append(" Latest user request: ").append(limitText(userMessage, 220));
        }
        return context.toString();
    }

    private void addUserMessage(AiStylistSession session, String content) {
        session.getMessages().add(AiStylistMessage.builder()
                .session(session)
                .role(AiStylistMessageRole.USER)
                .content(content)
                .build());
    }

    private void addAssistantMessage(AiStylistSession session, String content, String metadataJson) {
        session.getMessages().add(AiStylistMessage.builder()
                .session(session)
                .role(AiStylistMessageRole.ASSISTANT)
                .content(content)
                .metadataJson(metadataJson)
                .build());
    }

    private AiStylistSessionDTO toSessionDTO(AiStylistSession session, Map<Long, Costume> activeCostumesById) {
        return new AiStylistSessionDTO(
                session.getId(),
                session.getUser() != null ? session.getUser().getId() : null,
                session.getGuestSessionId(),
                session.getContextCostume() != null ? CostumeDTO.fromEntity(session.getContextCostume()) : null,
                session.getMessages().stream()
                        .map(message -> AiStylistMessageDTO.fromEntity(
                                message,
                                aiChatContextBuilder.readStoredRecommendations(message.getMetadataJson(), activeCostumesById),
                                readFallbackFlag(message.getMetadataJson())
                        ))
                        .toList(),
                session.getCreatedAt() != null ? session.getCreatedAt().toString() : null,
                session.getUpdatedAt() != null ? session.getUpdatedAt().toString() : null
        );
    }

    private String writeAssistantMetadata(List<SimilarCostumeRecommendationDTO> recommendations,
                                          AvailabilityWindow availabilityWindow,
                                          AiIntentUnderstandingService.IntentUnderstandingResult understoodIntent,
                                          String latestUserMessage,
                                          String assistantContent,
                                          String fallbackUserNeedSummary) {
        return writeAssistantMetadata(
                recommendations,
                availabilityWindow,
                understoodIntent,
                latestUserMessage,
                assistantContent,
                fallbackUserNeedSummary,
                Map.of()
        );
    }

    private String writeAssistantMetadata(List<SimilarCostumeRecommendationDTO> recommendations,
                                          AvailabilityWindow availabilityWindow,
                                          AiIntentUnderstandingService.IntentUnderstandingResult understoodIntent,
                                          String latestUserMessage,
                                          String assistantContent,
                                          String fallbackUserNeedSummary,
                                          Map<String, Object> metadataExtras) {
        List<Map<String, Object>> summaries = recommendations == null ? List.of() : recommendations.stream()
                .map(item -> {
                    Map<String, Object> summary = new LinkedHashMap<>();
                    summary.put("costumeId", item.costume().id());
                    summary.put("reason", item.reason());
                    summary.put("score", item.score());
                    summary.put("availableItemCount", item.availableItemCount());
                    if (availabilityWindow != null) {
                        summary.put("rentalStartDate", availabilityWindow.startDate().format(DATE_FORMATTER));
                        summary.put("rentalEndDate", availabilityWindow.endDate().format(DATE_FORMATTER));
                    }
                    return summary;
                })
                .toList();

        try {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("detectedIntent", understoodIntent.intent().name());
            metadata.put("detectedIntentJson", understoodIntent.intentJson());
            metadata.put("responseSummary", limitText(assistantContent, 240));
            metadata.put("lastUserMessage", limitText(latestUserMessage, 240));
            metadata.put("lastUserNeedSummary", buildUserNeedSummary(understoodIntent, fallbackUserNeedSummary));
            metadata.put("language", understoodIntent.language().providerCode());
            if (availabilityWindow != null) {
                metadata.put("rentalStartDate", availabilityWindow.startDate().format(DATE_FORMATTER));
                metadata.put("rentalEndDate", availabilityWindow.endDate().format(DATE_FORMATTER));
            }
            metadata.put("recommendations", summaries);
            if (metadataExtras != null && !metadataExtras.isEmpty()) {
                metadata.putAll(metadataExtras);
            }
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String buildUserNeedSummary(AiIntentUnderstandingService.IntentUnderstandingResult understoodIntent,
                                        String fallbackUserNeedSummary) {
        if (understoodIntent == null) {
            return fallbackUserNeedSummary;
        }

        List<String> parts = new ArrayList<>();
        if (understoodIntent.occasion() != null) {
            parts.add("occasion=" + understoodIntent.occasion());
        }
        if (understoodIntent.style() != null) {
            parts.add("style=" + understoodIntent.style());
        }
        if (understoodIntent.color() != null) {
            parts.add("color=" + understoodIntent.color());
        }
        if (understoodIntent.gender() != null) {
            parts.add("gender=" + understoodIntent.gender());
        }
        if (understoodIntent.size() != null) {
            parts.add("size=" + understoodIntent.size());
        }
        return parts.isEmpty() ? fallbackUserNeedSummary : String.join(", ", parts);
    }

    private User resolveAuthenticatedUser(String authenticatedEmail) {
        String normalizedEmail = normalize(authenticatedEmail);
        if (normalizedEmail == null) {
            return null;
        }

        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authenticatedEmail));
    }

    private User requireAuthenticatedUser(String authenticatedEmail) {
        User user = resolveAuthenticatedUser(authenticatedEmail);
        if (user == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }
        return user;
    }

    private List<UserInteractionEvent> loadRecentEvents(AiStylistSession session, String fallbackGuestSessionId, String authenticatedEmail) {
        List<UserInteractionEvent> mergedEvents = new ArrayList<>();
        Set<Long> seenEventIds = new LinkedHashSet<>();

        User user = session.getUser() != null ? session.getUser() : resolveAuthenticatedUser(authenticatedEmail);
        if (user != null && user.getId() != null) {
            for (UserInteractionEvent event : userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(user.getId())) {
                if (event.getId() != null && seenEventIds.add(event.getId())) {
                    mergedEvents.add(event);
                }
            }
        }

        String guestSessionId = normalize(session.getGuestSessionId());
        if (guestSessionId == null) {
            guestSessionId = normalize(fallbackGuestSessionId);
        }
        if (guestSessionId != null) {
            for (UserInteractionEvent event : userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc(guestSessionId)) {
                if (event.getId() != null && seenEventIds.add(event.getId())) {
                    mergedEvents.add(event);
                }
            }
        }

        return mergedEvents.stream()
                .sorted(Comparator.comparing(UserInteractionEvent::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(HISTORY_EVENT_LIMIT)
                .toList();
    }

    private StylistPreferenceProfile buildPreferenceProfile(List<UserInteractionEvent> events, Map<Long, Costume> activeCostumesById) {
        StylistPreferenceProfile profile = new StylistPreferenceProfile();

        for (int index = 0; index < events.size(); index++) {
            UserInteractionEvent event = events.get(index);
            int eventWeight = interactionEventWeight(event.getEventType(), index);
            if (eventWeight <= 0) {
                continue;
            }

            Long costumeId = parseLong(event.getTargetId());
            if (costumeId != null) {
                Costume sourceCostume = activeCostumesById.get(costumeId);
                if (sourceCostume != null) {
                    profile.addCostumeInterest(costumeId, directCostumeBoost(event.getEventType(), index));
                    profile.addCostumeMetadata(sourceCostume, eventWeight);
                }
            }

            profile.addMetadata(parseMetadataMap(event.getMetadataJson()), eventWeight);
            profile.addKeywords(event.getQueryText(), keywordEventBoost(event.getEventType()));
        }

        return profile;
    }

    private Map<String, Object> parseMetadataMap(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }

        try {
            return normalizeInteractionMetadata(objectMapper.readValue(metadataJson.trim(), METADATA_TYPE));
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private Map<String, Object> normalizeInteractionMetadata(Map<String, Object> metadataMap) {
        if (metadataMap == null || metadataMap.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> normalizedMetadata = new LinkedHashMap<>(metadataMap);
        String category = firstNonBlank(
                readMetadataString(metadataMap.get("category")),
                readMetadataString(metadataMap.get("categoryName")),
                readMetadataString(metadataMap.get("subcategory")),
                categoryLabelFromPath(readMetadataString(metadataMap.get("categoryPath")))
        );
        if (category != null) {
            normalizedMetadata.put("category", category);
        }

        List<String> tags = new ArrayList<>();
        appendStringValues(tags, metadataMap.get("tags"));
        appendStringValue(tags, readMetadataString(metadataMap.get("tag")));
        appendStringValue(tags, readMetadataString(metadataMap.get("subcategory")));
        if (!tags.isEmpty()) {
            normalizedMetadata.put("tags", tags);
        }

        return normalizedMetadata;
    }

    private void appendStringValues(List<String> target, Object rawValue) {
        if (target == null || rawValue == null) {
            return;
        }

        if (rawValue instanceof Collection<?> values) {
            for (Object value : values) {
                appendStringValue(target, readMetadataString(value));
            }
            return;
        }

        appendStringValue(target, readMetadataString(rawValue));
    }

    private void appendStringValue(List<String> target, String rawValue) {
        if (target == null) {
            return;
        }

        String normalizedValue = readMetadataString(rawValue);
        if (normalizedValue == null || target.contains(normalizedValue)) {
            return;
        }

        target.add(normalizedValue);
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }

        for (String value : values) {
            String normalizedValue = readMetadataString(value);
            if (normalizedValue != null) {
                return normalizedValue;
            }
        }

        return null;
    }

    private String categoryLabelFromPath(String categoryPath) {
        String normalizedPath = readMetadataString(categoryPath);
        if (normalizedPath == null) {
            return null;
        }

        int lastSeparator = normalizedPath.lastIndexOf('/');
        String lastSegment = lastSeparator >= 0 ? normalizedPath.substring(lastSeparator + 1) : normalizedPath;
        String label = lastSegment.replace('-', ' ').trim();
        return label.isEmpty() ? null : label;
    }

    private String readMetadataString(Object value) {
        if (value == null) {
            return null;
        }

        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private int interactionEventWeight(InteractionEventType eventType, int eventIndex) {
        int base = switch (eventType) {
            case RENT -> 7;
            case ADD_TO_CART -> 6;
            case RECOMMENDATION_CLICK -> 5;
            case VIEW_PRODUCT -> 3;
            case SEARCH, CHAT_QUERY -> 2;
            default -> 0;
        };

        if (eventIndex < 5) {
            return base + 2;
        }
        if (eventIndex < 10) {
            return base + 1;
        }
        return base;
    }

    private int directCostumeBoost(InteractionEventType eventType, int eventIndex) {
        int boost = switch (eventType) {
            case VIEW_PRODUCT, RECOMMENDATION_CLICK, ADD_TO_CART, RENT -> 8;
            default -> 0;
        };

        if (eventIndex < 5) {
            return boost + 2;
        }
        if (eventIndex < 10) {
            return boost + 1;
        }
        return boost;
    }

    private int keywordEventBoost(InteractionEventType eventType) {
        return switch (eventType) {
            case SEARCH, CHAT_QUERY -> 2;
            default -> 0;
        };
    }

    private StylistIntent buildStylistIntent(String message, AiIntentUnderstandingService.IntentUnderstandingResult understoodIntent) {
        String normalizedMessage = normalizeText(message);
        Set<String> tokens = new LinkedHashSet<>();
        if (normalizedMessage != null) {
            for (String token : normalizedMessage.split("\\s+")) {
                if (token.length() >= 3 && !LOW_SIGNAL_TOKENS.contains(token) && !token.chars().allMatch(Character::isDigit)) {
                    tokens.add(token);
                }
            }
        }

        appendEntityTokens(tokens, understoodIntent.occasion());
        appendEntityTokens(tokens, understoodIntent.style());
        appendEntityTokens(tokens, understoodIntent.color());
        appendEntityTokens(tokens, understoodIntent.gender());
        appendEntityTokens(tokens, understoodIntent.productMentioned());
        Set<String> requestedSizes = understoodIntent.size() == null
                ? Set.of()
                : Set.of(understoodIntent.size());
        BigDecimal maxBudget = understoodIntent.budget() != null ? understoodIntent.budget() : extractMaxBudget(message);
        String signalSource = String.join(" ",
                safe(message),
                safe(understoodIntent.occasion()),
                safe(understoodIntent.style()),
                safe(understoodIntent.color()),
                safe(understoodIntent.gender()),
                safe(understoodIntent.productMentioned())
        );

        return new StylistIntent(
                tokens,
                maxBudget,
                requestedSizes,
                extractIntentSignals(normalizeText(signalSource))
        );
    }

    private void appendEntityTokens(Set<String> tokens, String rawValue) {
        String normalizedValue = normalizeText(rawValue);
        if (normalizedValue == null) {
            return;
        }

        for (String token : normalizedValue.split("\\s+")) {
            if (token.length() >= 3 && !LOW_SIGNAL_TOKENS.contains(token) && !token.chars().allMatch(Character::isDigit)) {
                tokens.add(token);
            }
        }
    }

    private Set<String> extractIntentSignals(String normalizedMessage) {
        String intentText = normalizeForLanguageDetection(normalizedMessage);
        if (intentText == null || intentText.isBlank()) {
            return Set.of();
        }

        LinkedHashSet<String> signals = new LinkedHashSet<>();
        for (IntentSignalGroup group : INTENT_SIGNAL_GROUPS) {
            for (String alias : group.aliases()) {
                if (intentText.contains(alias)) {
                    signals.add(group.key());
                    break;
                }
            }
        }
        return signals;
    }

    private BigDecimal extractMaxBudget(String message) {
        if (message == null || message.isBlank()) {
            return null;
        }

        String normalizedMessage = normalizeText(message);
        boolean hasBudgetHint = normalizedMessage.contains("ngan sach")
                || normalizedMessage.contains("toi da")
                || normalizedMessage.contains("duoi")
                || normalizedMessage.contains("gia");

        String budgetSource = normalizeBudgetSource(message);
        Matcher matcher = BUDGET_WITH_UNIT_PATTERN.matcher(budgetSource);
        while (matcher.find()) {
            BigDecimal parsedBudget = parseBudgetValue(matcher.group(1), matcher.group(2));
            if (parsedBudget != null) {
                return parsedBudget;
            }
        }

        if (!hasBudgetHint) {
            return null;
        }

        Matcher groupedMatcher = GROUPED_BUDGET_PATTERN.matcher(budgetSource);
        while (groupedMatcher.find()) {
            BigDecimal parsedBudget = parseBudgetValue(groupedMatcher.group(1), null);
            if (parsedBudget != null) {
                return parsedBudget;
            }
        }

        return null;
    }

    private BigDecimal parseBudgetValue(String rawNumber, String rawUnit) {
        if (rawNumber == null || rawNumber.isBlank()) {
            return null;
        }

        String normalizedUnit = rawUnit != null ? normalizeBudgetSource(rawUnit) : "";

        try {
            BigDecimal numericValue = parseBudgetNumber(rawNumber, normalizedUnit.startsWith("tr")
                    || normalizedUnit.startsWith("k")
                    || normalizedUnit.startsWith("ng"));
            if (normalizedUnit.startsWith("tr")) {
                return numericValue.multiply(BigDecimal.valueOf(1_000_000L));
            }
            if (normalizedUnit.startsWith("k") || normalizedUnit.startsWith("ng")) {
                return numericValue.multiply(BigDecimal.valueOf(1_000L));
            }
            return numericValue;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private BigDecimal parseBudgetNumber(String rawNumber, boolean allowDecimalUnit) {
        String compactNumber = rawNumber.replaceAll("\\s+", "");
        if (allowDecimalUnit && compactNumber.matches("\\d+[.,]\\d{1,2}")) {
            return new BigDecimal(compactNumber.replace(',', '.'));
        }

        return new BigDecimal(compactNumber.replace(".", "").replace(",", ""));
    }

    private String normalizeBudgetSource(String value) {
        if (value == null) {
            return "";
        }

        String asciiValue = Normalizer.normalize(value.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return asciiValue.replace('đ', 'd');
    }

    private int countKeywordMatches(Costume candidate, Set<String> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            return 0;
        }

        String searchableText = buildSearchableText(candidate);

        if (searchableText == null) {
            return 0;
        }

        int matchCount = 0;
        for (String token : tokens) {
            if (searchableText.contains(token)) {
                matchCount++;
            }
        }
        return matchCount;
    }

    private IntentMatch evaluateLatestIntentMatch(Costume candidate, CostumeMetadataDTO candidateMetadata, StylistIntent intent) {
        String searchableText = normalizeForLanguageDetection(buildSearchableText(candidate));
        if (searchableText == null) {
            return new IntentMatch(0, 0);
        }

        int signalMatchCount = 0;
        for (IntentSignalGroup group : INTENT_SIGNAL_GROUPS) {
            if (!intent.intentSignals().contains(group.key())) {
                continue;
            }
            for (String alias : group.aliases()) {
                if (searchableText.contains(alias)) {
                    signalMatchCount++;
                    break;
                }
            }
        }

        int score = signalMatchCount * 18;
        if (intent.hasExplicitSignals() && signalMatchCount == 0) {
            score -= 12;
        }

        String normalizedGender = normalize(candidateMetadata != null ? candidateMetadata.gender() : null);
        if (normalizedGender != null && intent.tokens().contains(normalizedGender)) {
            score += 6;
        }

        String normalizedColor = normalize(candidateMetadata != null ? candidateMetadata.color() : null);
        if (normalizedColor != null && intent.tokens().contains(normalizedColor)) {
            score += 5;
        }

        return new IntentMatch(score, signalMatchCount);
    }

    private String buildSearchableText(Costume candidate) {
        return normalizeText(
                String.join(" ",
                        safe(candidate.getName()),
                        safe(candidate.getDescription()),
                        candidate.getCategory() != null ? safe(candidate.getCategory().getName()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getStyle()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getOccasion()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getSeason()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getColor()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getGender()) : "",
                        candidate.getMetadata() != null ? String.join(" ", candidate.getMetadata().getTags()) : ""
                )
        );
    }

    private int countSharedTags(List<String> leftTags, List<String> rightTags) {
        Set<String> normalizedLeft = normalizeTags(leftTags);
        if (normalizedLeft.isEmpty()) {
            return 0;
        }

        Set<String> normalizedRight = normalizeTags(rightTags);
        normalizedLeft.retainAll(normalizedRight);
        return normalizedLeft.size();
    }

    private Set<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return new LinkedHashSet<>();
        }

        LinkedHashSet<String> normalizedTags = new LinkedHashSet<>();
        for (String tag : tags) {
            String normalizedTag = normalize(tag);
            if (normalizedTag != null) {
                normalizedTags.add(normalizedTag);
            }
        }
        return normalizedTags;
    }

    private boolean isInBudget(Costume candidate, BigDecimal maxBudget) {
        if (candidate == null || candidate.getRentalPrice() == null || maxBudget == null) {
            return false;
        }

        return candidate.getRentalPrice().compareTo(maxBudget) <= 0;
    }

    private boolean equalsIgnoreCase(String left, String right) {
        String normalizedLeft = normalize(left);
        String normalizedRight = normalize(right);
        return normalizedLeft != null && normalizedLeft.equals(normalizedRight);
    }

    private AvailabilityWindow resolveAvailabilityWindow(LocalDate rentalStartDate,
                                                         LocalDate rentalEndDate,
                                                         String parsedRentalDate) {
        if (rentalStartDate == null && rentalEndDate == null) {
            return resolveAvailabilityWindowFromIntent(parsedRentalDate);
        }

        if (rentalStartDate == null || rentalEndDate == null) {
            throw new BadRequestException("rentalStartDate and rentalEndDate must be provided together.");
        }

        if (!rentalEndDate.isAfter(rentalStartDate)) {
            throw new BadRequestException("rentalEndDate must be after rentalStartDate.");
        }

        return new AvailabilityWindow(rentalStartDate, rentalEndDate);
    }

    private AvailabilityWindow resolveAvailabilityWindowFromIntent(String parsedRentalDate) {
        if (parsedRentalDate == null || parsedRentalDate.isBlank()) {
            return null;
        }

        LocalDate today = LocalDate.now();
        return switch (parsedRentalDate) {
            case "today" -> new AvailabilityWindow(today, today);
            case "tomorrow" -> {
                LocalDate targetDate = today.plusDays(1);
                yield new AvailabilityWindow(targetDate, targetDate);
            }
            case "this_weekend" -> {
                LocalDate saturday = today.with(java.time.temporal.TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SATURDAY));
                yield new AvailabilityWindow(saturday, saturday.plusDays(1));
            }
            case "next_week" -> {
                LocalDate monday = today.with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY));
                yield new AvailabilityWindow(monday, monday.plusDays(6));
            }
            default -> {
                try {
                    LocalDate targetDate = LocalDate.parse(parsedRentalDate);
                    yield new AvailabilityWindow(targetDate, targetDate);
                } catch (Exception ignored) {
                    yield null;
                }
            }
        };
    }

    private AvailabilityWindow readAvailabilityWindow(Map<String, Object> summary) {
        LocalDate rentalStartDate = parseLocalDate(summary.get("rentalStartDate"));
        LocalDate rentalEndDate = parseLocalDate(summary.get("rentalEndDate"));
        if (rentalStartDate == null || rentalEndDate == null) {
            return null;
        }

        if (!rentalEndDate.isAfter(rentalStartDate)) {
            return null;
        }

        return new AvailabilityWindow(rentalStartDate, rentalEndDate);
    }

    private AvailabilitySnapshot buildAvailabilitySnapshot(Collection<Costume> costumes, AvailabilityWindow availabilityWindow) {
        if (availabilityWindow == null) {
            return new AvailabilitySnapshot(null, Set.of());
        }

        Set<Long> availableItemIds = costumes.stream()
                .flatMap(costume -> costume.getItems().stream())
                .filter(item -> ItemStatus.AVAILABLE.equals(item.getStatus()))
                .map(CostumeItem::getId)
                .filter(id -> id != null)
                .collect(Collectors.toCollection(HashSet::new));

        if (availableItemIds.isEmpty()) {
            return new AvailabilitySnapshot(availabilityWindow, Set.of());
        }

        Set<Long> blockedItemIds = new HashSet<>(rentalOrderDetailRepository.findBookedCostumeItemIdsForPeriod(
                availableItemIds,
                availabilityWindow.startAt(),
                availabilityWindow.endAt(),
                OrderStatus.CANCELLED
        ));

        return new AvailabilitySnapshot(availabilityWindow, blockedItemIds);
    }

    private String formatAvailabilityWindow(AvailabilityWindow availabilityWindow) {
        return availabilityWindow.startDate().format(DATE_FORMATTER) + " den " + availabilityWindow.endDate().format(DATE_FORMATTER);
    }

    private String formatAvailabilityWindowVi(AvailabilityWindow availabilityWindow) {
        return availabilityWindow.startDate().format(DATE_FORMATTER) + " đến " + availabilityWindow.endDate().format(DATE_FORMATTER);
    }

    private String formatAvailabilityWindowEn(AvailabilityWindow availabilityWindow) {
        return availabilityWindow.startDate().format(DATE_FORMATTER) + " to " + availabilityWindow.endDate().format(DATE_FORMATTER);
    }

    private boolean looksLikeProductSpecificQuestion(String userMessage) {
        String normalizedMessage = normalizeText(userMessage);
        if (normalizedMessage == null) {
            return false;
        }

        return normalizedMessage.contains("san pham nay")
                || normalizedMessage.contains("costume nay")
                || normalizedMessage.contains("bo nay")
                || normalizedMessage.contains("co con hang");
    }

    private ChatIntent detectChatIntent(String userMessage, Costume selectedCostume, StylistIntent intent) {
        String normalizedMessage = normalizeForLanguageDetection(userMessage);
        if (normalizedMessage == null || normalizedMessage.isBlank()) {
            return ChatIntent.CASUAL_CHAT;
        }

        if (containsAnyPhrase(normalizedMessage, RENTAL_SUPPORT_PHRASES)) {
            return ChatIntent.RENTAL_SUPPORT;
        }
        if (isProductQuestion(normalizedMessage, selectedCostume, intent)) {
            return ChatIntent.PRODUCT_QUESTION;
        }
        if (isRecommendationRequest(normalizedMessage, intent)) {
            return ChatIntent.RECOMMENDATION_REQUEST;
        }
        if (containsAnyPhrase(normalizedMessage, CASUAL_CHAT_PHRASES)) {
            return ChatIntent.CASUAL_CHAT;
        }
        return ChatIntent.OUT_OF_SCOPE;
    }

    private boolean isRecommendationRequest(String normalizedMessage, StylistIntent intent) {
        return containsAnyPhrase(normalizedMessage, RECOMMENDATION_REQUEST_PHRASES)
                || (intent != null && intent.hasExplicitSignals());
    }

    private boolean isProductQuestion(String normalizedMessage, Costume selectedCostume, StylistIntent intent) {
        boolean hasExplicitReference = containsAnyPhrase(normalizedMessage, PRODUCT_REFERENCE_PHRASES)
                || looksLikeProductSpecificQuestion(normalizedMessage);
        boolean asksProductDetail = containsAnyPhrase(normalizedMessage, PRODUCT_DETAIL_PHRASES)
                || (intent != null && !intent.requestedSizes().isEmpty());
        if (hasExplicitReference && asksProductDetail) {
            return true;
        }
        return selectedCostume != null
                && asksProductDetail
                && !containsAnyPhrase(normalizedMessage, RECOMMENDATION_REQUEST_PHRASES)
                && (intent == null || !intent.hasExplicitSignals());
    }

    private boolean containsAnyPhrase(String normalizedMessage, Set<String> phrases) {
        for (String phrase : phrases) {
            Pattern pattern = Pattern.compile("(^|[^\\p{L}\\p{N}])" + Pattern.quote(phrase) + "([^\\p{L}\\p{N}]|$)");
            if (pattern.matcher(normalizedMessage).find()) {
                return true;
            }
        }
        return false;
    }

    private Set<String> extractAvailableValues(Costume costume,
                                               AvailabilitySnapshot availabilitySnapshot,
                                               java.util.function.Function<CostumeItem, String> extractor) {
        if (costume == null || costume.getItems() == null) {
            return Set.of();
        }

        LinkedHashSet<String> values = new LinkedHashSet<>();
        for (CostumeItem item : costume.getItems()) {
            if (!ItemStatus.AVAILABLE.equals(item.getStatus())) {
                continue;
            }
            if (availabilitySnapshot != null && availabilitySnapshot.availabilityWindow() != null
                    && item.getId() != null && availabilitySnapshot.blockedItemIds().contains(item.getId())) {
                continue;
            }

            String value = extractor.apply(item);
            if (value != null && !value.isBlank()) {
                values.add(value.trim());
            }
        }
        return values;
    }

    private String joinValuesOrFallback(Set<String> values, ReplyLanguage replyLanguage) {
        if (values == null || values.isEmpty()) {
            return replyText(replyLanguage, "chưa có dữ liệu rõ ràng", "not clearly available in the current context");
        }
        return String.join("/", values);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = NORMALIZE_TEXT_PATTERN.matcher(value.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
        return normalized.isEmpty() ? null : normalized.replaceAll("\\s+", " ");
    }

    private ChatIntent mapChatIntent(AiIntentUnderstandingService.IntentType intentType) {
        if (intentType == null) {
            return ChatIntent.OUT_OF_SCOPE;
        }

        return switch (intentType) {
            case CASUAL_CHAT -> ChatIntent.CASUAL_CHAT;
            case RECOMMENDATION_REQUEST -> ChatIntent.RECOMMENDATION_REQUEST;
            case RECOMMENDATION_EXPLANATION_FOLLOW_UP -> ChatIntent.RECOMMENDATION_EXPLANATION_FOLLOW_UP;
            case PRODUCT_QUESTION -> ChatIntent.PRODUCT_QUESTION;
            case RENTAL_SUPPORT -> ChatIntent.RENTAL_SUPPORT;
            case OUT_OF_SCOPE -> ChatIntent.OUT_OF_SCOPE;
        };
    }

    private ReplyLanguage mapReplyLanguage(AiIntentUnderstandingService.Language language) {
        if (language == AiIntentUnderstandingService.Language.EN) {
            return ReplyLanguage.EN;
        }
        return ReplyLanguage.VI;
    }

    private ReplyLanguage detectReplyLanguage(String message) {
        if (message == null || message.isBlank()) {
            return ReplyLanguage.VI;
        }

        if (VIETNAMESE_ACCENT_PATTERN.matcher(message).find()) {
            return ReplyLanguage.VI;
        }

        if (NON_LATIN_SCRIPT_PATTERN.matcher(message).find()) {
            return ReplyLanguage.OTHER;
        }

        String normalized = normalizeForLanguageDetection(message);
        if (normalized == null) {
            return ReplyLanguage.VI;
        }

        List<String> tokens = List.of(normalized.split("\\s+"));
        int viScore = countLanguageHints(tokens, VI_LANGUAGE_HINTS);
        int enScore = countLanguageHints(tokens, EN_LANGUAGE_HINTS);

        if (enScore >= 2 && enScore > viScore) {
            return ReplyLanguage.EN;
        }
        if (viScore >= 1) {
            return ReplyLanguage.VI;
        }
        if (enScore == 1 && tokens.size() <= 3) {
            return ReplyLanguage.EN;
        }

        return ReplyLanguage.OTHER;
    }

    private String normalizeForLanguageDetection(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }

        String stripped = Normalizer.normalize(normalized, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
        return stripped.isBlank() ? null : stripped;
    }

    private int countLanguageHints(List<String> tokens, Set<String> hints) {
        int score = 0;
        for (String token : tokens) {
            if (hints.contains(token)) {
                score++;
            }
        }
        return score;
    }

    private String replyText(ReplyLanguage replyLanguage, String vietnamese, String english) {
        return replyLanguage.isVietnamese() ? vietnamese : english;
    }

    private String formatPrice(BigDecimal value, ReplyLanguage replyLanguage) {
        if (value == null) {
            return replyLanguage.isVietnamese() ? "không rõ giá" : "price unavailable";
        }

        DecimalFormat decimalFormat = new DecimalFormat("#,###");
        decimalFormat.setRoundingMode(RoundingMode.HALF_UP);
        return decimalFormat.format(value) + " VND";
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String summarize(Exception exception) {
        if (exception == null) {
            return "unknown error";
        }

        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return exception.getClass().getSimpleName();
        }

        return exception.getClass().getSimpleName() + ": " + message;
    }

    private Boolean readFallbackFlag(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return null;
        }

        try {
            Map<String, Object> metadata = objectMapper.readValue(metadataJson.trim(), METADATA_TYPE);
            Object fallbackValue = metadata.get("fallback");
            if (fallbackValue == null) {
                return null;
            }
            if (fallbackValue instanceof Boolean booleanValue) {
                return booleanValue;
            }
            return Boolean.parseBoolean(fallbackValue.toString());
        } catch (Exception ignored) {
            return null;
        }
    }

    private String resolveReasoningFallbackReason(Exception exception) {
        if (exception instanceof com.aurafit.exception.AiReasoningGuardrailException guardrailException
                && guardrailException.getFallbackReason() != null) {
            return guardrailException.getFallbackReason().name();
        }
        if (exception instanceof AiReasoningParseException) {
            return "PARSE_ERROR";
        }
        String message = exception != null && exception.getMessage() != null
                ? exception.getMessage().toLowerCase(Locale.ROOT)
                : "";
        if (message.contains("timed out")) {
            return "TIMEOUT";
        }
        return "OTHER";
    }

    private String limitText(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private String decapitalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() == 1) {
            return trimmed.toLowerCase(Locale.ROOT);
        }
        return Character.toLowerCase(trimmed.charAt(0)) + trimmed.substring(1);
    }

    private String capitalizeFirst(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() == 1) {
            return trimmed.toUpperCase(Locale.ROOT);
        }
        return Character.toUpperCase(trimmed.charAt(0)) + trimmed.substring(1);
    }

    private Long parseLong(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private int intValue(Object value) {
        if (value == null) {
            return 0;
        }

        if (value instanceof Number number) {
            return number.intValue();
        }

        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private String stringValue(Object value) {
        return value != null ? value.toString() : null;
    }

    private LocalDate parseLocalDate(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return LocalDate.parse(value.toString(), DATE_FORMATTER);
        } catch (Exception ignored) {
            return null;
        }
    }

    private AiStylistSession choosePreferredSession(AiStylistSession left, AiStylistSession right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return compareSessionRecency(left, right) >= 0 ? left : right;
    }

    private int compareSessionRecency(AiStylistSession left, AiStylistSession right) {
        return Comparator
                .comparing(AiStylistSession::getUpdatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(AiStylistSession::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(AiStylistSession::getId, Comparator.nullsLast(Long::compareTo))
                .compare(left, right);
    }

    private record StylistIntent(Set<String> tokens,
                                 BigDecimal maxBudget,
                                 Set<String> requestedSizes,
                                 Set<String> intentSignals) {
        private boolean hasExplicitSignals() {
            return intentSignals != null && !intentSignals.isEmpty();
        }
    }

    private record IntentSignalGroup(String key, Set<String> aliases) {
    }

    private record IntentMatch(int score, int signalMatchCount) {
        private boolean hasSignalMatch() {
            return signalMatchCount > 0;
        }
    }

    private record StylistCandidate(Costume costume, int score, int availableItemCount, String reason) {
    }

    private record ReasoningCandidatePool(
            List<RecommendationReasoningInput.CandidateCostume> candidates,
            Map<String, RecommendationReasoningInput.CandidateCostume> candidatesById
    ) {
    }

    private record AvailabilityWindow(LocalDate startDate, LocalDate endDate) {
        private LocalDateTime startAt() {
            return startDate.atStartOfDay();
        }

        private LocalDateTime endAt() {
            return endDate.atTime(LocalTime.MAX);
        }
    }

    private record AvailabilitySnapshot(AvailabilityWindow availabilityWindow, Set<Long> blockedItemIds) {
        private int availableItemCount(Costume costume, Set<String> requestedSizes) {
            if (costume == null || costume.getItems() == null) {
                return 0;
            }

            return (int) costume.getItems().stream()
                    .filter(item -> ItemStatus.AVAILABLE.equals(item.getStatus()))
                    .filter(item -> availabilityWindow == null || item.getId() == null || !blockedItemIds.contains(item.getId()))
                    .filter(item -> requestedSizes == null || requestedSizes.isEmpty() || matchesRequestedSize(item, requestedSizes))
                    .count();
        }

        private boolean matchesRequestedSize(CostumeItem item, Set<String> requestedSizes) {
            String normalizedItemSize = AiStylistServiceImpl.normalizeSize(item != null ? item.getSize() : null);
            return normalizedItemSize != null && requestedSizes.contains(normalizedItemSize);
        }
    }

    private AvailabilityWindow toAvailabilityWindow(AiChatContext chatContext) {
        if (chatContext == null
                || chatContext.lastRecommendationRentalStartDate() == null
                || chatContext.lastRecommendationRentalEndDate() == null) {
            return null;
        }
        return new AvailabilityWindow(
                chatContext.lastRecommendationRentalStartDate(),
                chatContext.lastRecommendationRentalEndDate()
        );
    }

    private static String normalizeSize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private enum ChatIntent {
        CASUAL_CHAT,
        RECOMMENDATION_REQUEST,
        RECOMMENDATION_EXPLANATION_FOLLOW_UP,
        RENTAL_SUPPORT,
        PRODUCT_QUESTION,
        OUT_OF_SCOPE
    }

    private enum ReplyLanguage {
        VI("vi"),
        EN("en"),
        OTHER("same_as_user");

        private final String providerCode;

        ReplyLanguage(String providerCode) {
            this.providerCode = providerCode;
        }

        private String providerCode() {
            return providerCode;
        }

        private boolean isVietnamese() {
            return this == VI;
        }
    }

    private static final class StylistPreferenceProfile {
        private final Map<String, Integer> styles = new HashMap<>();
        private final Map<String, Integer> occasions = new HashMap<>();
        private final Map<String, Integer> seasons = new HashMap<>();
        private final Map<String, Integer> colors = new HashMap<>();
        private final Map<String, Integer> categories = new HashMap<>();
        private final Map<String, Integer> tags = new HashMap<>();
        private final Map<String, Integer> keywords = new HashMap<>();
        private final Map<Long, Integer> costumes = new HashMap<>();

        boolean isEmpty() {
            return styles.isEmpty()
                    && occasions.isEmpty()
                    && seasons.isEmpty()
                    && colors.isEmpty()
                    && categories.isEmpty()
                    && tags.isEmpty()
                    && keywords.isEmpty()
                    && costumes.isEmpty();
        }

        Map<String, Integer> styles() {
            return styles;
        }

        Map<String, Integer> occasions() {
            return occasions;
        }

        Map<String, Integer> seasons() {
            return seasons;
        }

        Map<String, Integer> colors() {
            return colors;
        }

        Map<String, Integer> categories() {
            return categories;
        }

        Map<String, Integer> tags() {
            return tags;
        }

        void addCostumeInterest(Long costumeId, int score) {
            if (costumeId == null || score <= 0) {
                return;
            }

            costumes.merge(costumeId, score, Integer::sum);
        }

        int costumeScore(Long costumeId) {
            if (costumeId == null) {
                return 0;
            }

            return costumes.getOrDefault(costumeId, 0);
        }

        void addCostumeMetadata(Costume costume, int weight) {
            if (costume == null || weight <= 0) {
                return;
            }

            CostumeMetadataDTO metadata = CostumeMetadataDTO.fromEntity(costume.getMetadata());
            add(styles, metadata != null ? metadata.style() : null, weight);
            add(occasions, metadata != null ? metadata.occasion() : null, weight);
            add(seasons, metadata != null ? metadata.season() : null, weight);
            add(colors, metadata != null ? metadata.color() : null, weight);
            add(categories, costume.getCategory() != null ? costume.getCategory().getName() : null, weight);

            if (metadata != null && metadata.tags() != null) {
                for (String tag : metadata.tags()) {
                    add(tags, tag, weight);
                }
            }
        }

        void addMetadata(Map<String, Object> metadataMap, int weight) {
            if (metadataMap == null || metadataMap.isEmpty() || weight <= 0) {
                return;
            }

            add(styles, readString(metadataMap.get("style")), weight);
            add(occasions, readString(metadataMap.get("occasion")), weight);
            add(seasons, readString(metadataMap.get("season")), weight);
            add(colors, readString(metadataMap.get("color")), weight);
            add(categories, readString(metadataMap.get("category")), weight);
            addCollection(tags, metadataMap.get("tags"), weight);
        }

        void addKeywords(String queryText, int weight) {
            String normalizedQuery = normalizeStatic(queryText);
            if (normalizedQuery == null || weight <= 0) {
                return;
            }

            for (String token : normalizedQuery.split("\\s+")) {
                if (token.length() >= 3) {
                    keywords.merge(token, weight, Integer::sum);
                }
            }
        }

        int attributeScore(Map<String, Integer> profileScores, String value, int multiplier) {
            String normalizedValue = normalizeStatic(value);
            if (normalizedValue == null) {
                return 0;
            }

            return profileScores.getOrDefault(normalizedValue, 0) * multiplier;
        }

        int tagScore(List<String> candidateTags, int unit, int cap) {
            if (candidateTags == null || candidateTags.isEmpty()) {
                return 0;
            }

            int score = 0;
            for (String tag : candidateTags) {
                String normalizedTag = normalizeStatic(tag);
                if (normalizedTag != null) {
                    score += tags.getOrDefault(normalizedTag, 0) * unit;
                }
            }
            return Math.min(cap, score);
        }

        int keywordScore(Costume candidate, int unit, int cap) {
            if (keywords.isEmpty() || candidate == null) {
                return 0;
            }

            String searchableText = normalizeStatic(
                    String.join(" ",
                            safe(candidate.getName()),
                            safe(candidate.getDescription()),
                            candidate.getCategory() != null ? safe(candidate.getCategory().getName()) : "",
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getStyle() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getOccasion() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getSeason() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getColor() : null),
                            candidate.getMetadata() != null ? String.join(" ", candidate.getMetadata().getTags()) : ""
                    )
            );

            if (searchableText == null) {
                return 0;
            }

            int score = 0;
            for (Map.Entry<String, Integer> entry : keywords.entrySet()) {
                if (searchableText.contains(entry.getKey())) {
                    score += entry.getValue() * unit;
                }
            }
            return Math.min(cap, score);
        }

        private void add(Map<String, Integer> profileScores, String value, int weight) {
            String normalizedValue = normalizeStatic(value);
            if (normalizedValue == null) {
                return;
            }

            profileScores.merge(normalizedValue, weight, Integer::sum);
        }

        private void addCollection(Map<String, Integer> profileScores, Object rawValue, int weight) {
            if (rawValue instanceof Collection<?> collection) {
                for (Object value : collection) {
                    add(profileScores, value != null ? value.toString() : null, weight);
                }
                return;
            }

            if (rawValue instanceof String text) {
                for (String token : text.split(",")) {
                    add(profileScores, token, weight);
                }
            }
        }

        private static String readString(Object value) {
            return value != null ? value.toString() : null;
        }

        private static String safe(String value) {
            return value == null ? "" : value;
        }

        private static String normalizeStatic(String value) {
            if (value == null) {
                return null;
            }

            String trimmed = value.trim().toLowerCase(Locale.ROOT);
            return trimmed.isEmpty() ? null : trimmed;
        }
    }
}

