package com.aurafit.service.stylist;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.dto.response.CatalogCostumeDTO;
import com.aurafit.dto.response.ChatMessageResponse;
import com.aurafit.entity.ChatMessage;
import com.aurafit.entity.ChatSession;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.User;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.ChatSessionRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.CostumeSpecification;
import com.aurafit.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class StylistRecommendationServiceImpl implements StylistRecommendationService {

    private static final int HISTORY_LIMIT = 3;
    private static final int RECOMMENDATION_LIMIT = 12;
    private static final int DAILY_USER_MESSAGE_LIMIT = 20;
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
            Dòng cuối bắt buộc có đúng định dạng RECOMMENDED_IDS: 1,5,9 và chỉ chứa ID từ danh sách được cung cấp.
            Không giải thích dòng RECOMMENDED_IDS và không đặt nội dung nào sau dòng đó.
            """;

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CostumeRepository costumeRepository;
    private final UserRepository userRepository;
    private final StylistIntentService stylistIntentService;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public StylistRecommendationServiceImpl(
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            CostumeRepository costumeRepository,
            UserRepository userRepository,
            StylistIntentService stylistIntentService,
            GeminiClient geminiClient,
            ObjectMapper objectMapper
    ) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.costumeRepository = costumeRepository;
        this.userRepository = userRepository;
        this.stylistIntentService = stylistIntentService;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
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

        ChatMessage savedUserMessage = chatMessageRepository.save(ChatMessage.builder()
                .chatSession(chatSession)
                .role(ChatMessageRole.USER)
                .content(userMessage.trim())
                .build());

        List<ChatMessage> recentHistory = getRecentHistory(chatSession);
        IntentResult intentResult = resolveIntent(userMessage, recentHistory, previousUserMessage);
        StylistFilterCriteria criteria = intentResult.criteria();
        savedUserMessage.setIntentJson(intentResult.intentJson());
        chatMessageRepository.save(savedUserMessage);

        List<Costume> candidates = costumeRepository.findAll(
                CostumeSpecification.build(criteria),
                PageRequest.of(
                        0,
                        RECOMMENDATION_LIMIT,
                        Sort.by(Sort.Direction.DESC, "availableItemCount")
                )
        ).getContent();

        if (candidates.isEmpty()) {
            saveAssistantMessage(chatSession, NO_RESULTS_REPLY, null);
            return new ChatMessageResponse(chatSession.getSessionId(), NO_RESULTS_REPLY, List.of());
        }

        String rawReply = geminiClient.generateText(
                AiCallType.RESPONSE_GENERATION,
                RECOMMENDATION_SYSTEM_PROMPT,
                buildRecommendationPrompt(userMessage, candidates)
        );

        ParsedRecommendation parsedRecommendation = parseRecommendation(rawReply, candidates);
        String recommendedIds = parsedRecommendation.costumeIds().isEmpty()
                ? null
                : parsedRecommendation.costumeIds().stream()
                        .map(String::valueOf)
                        .collect(Collectors.joining(","));

        saveAssistantMessage(chatSession, parsedRecommendation.replyText(), recommendedIds);

        List<CatalogCostumeDTO> recommendedCostumes = parsedRecommendation.costumeIds().stream()
                .map(costumeRepository::findByIdWithItems)
                .flatMap(java.util.Optional::stream)
                .map(CatalogCostumeDTO::fromEntity)
                .toList();

        return new ChatMessageResponse(
                chatSession.getSessionId(),
                parsedRecommendation.replyText(),
                recommendedCostumes
        );
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

    private IntentResult resolveIntent(
            String userMessage,
            List<ChatMessage> recentHistory,
            ChatMessage previousUserMessage
    ) {
        if (canReusePreviousIntent(userMessage, previousUserMessage)) {
            String cachedIntentJson = previousUserMessage.getIntentJson();
            return new IntentResult(deserializeCriteria(cachedIntentJson), cachedIntentJson);
        }

        StylistFilterCriteria criteria = stylistIntentService.extractIntent(userMessage, recentHistory);
        return new IntentResult(criteria, serializeCriteria(criteria));
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
        if (chatSession.getUser() == null && user != null) {
            chatSession.setUser(user);
            return chatSessionRepository.save(chatSession);
        }
        return chatSession;
    }

    private List<ChatMessage> getRecentHistory(ChatSession chatSession) {
        List<ChatMessage> recentMessages = new ArrayList<>(
                chatMessageRepository.findByChatSessionOrderByCreatedAtDesc(
                        chatSession,
                        PageRequest.of(0, HISTORY_LIMIT)
                )
        );
        Collections.reverse(recentMessages);
        return recentMessages;
    }

    private String serializeCriteria(StylistFilterCriteria criteria) {
        try {
            return objectMapper.writeValueAsString(criteria);
        } catch (JsonProcessingException exception) {
            return null;
        }
    }

    private String buildRecommendationPrompt(String userMessage, List<Costume> candidates) {
        StringBuilder prompt = new StringBuilder()
                .append("Yêu cầu khách hàng: ")
                .append(userMessage)
                .append("\n\nDanh sách sản phẩm được phép gợi ý:\n");

        candidates.forEach(costume -> {
            CostumeMetadata metadata = costume.getMetadata();
            prompt.append("ID: ").append(costume.getId())
                    .append(" | Tên: ").append(costume.getName())
                    .append(" | Giá thuê: ").append(costume.getRentalPrice())
                    .append(" | Style: ").append(metadata != null ? metadata.getStyle() : "không có")
                    .append(" | Occasion: ").append(metadata != null ? metadata.getOccasion() : "không có")
                    .append('\n');
        });

        return prompt.toString();
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

    private record IntentResult(StylistFilterCriteria criteria, String intentJson) {
    }
}
