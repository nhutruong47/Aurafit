package com.aurafit.service.stylist.impl;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.dto.response.CatalogCostumeDTO;
import com.aurafit.dto.response.ChatMessageResponse;
import com.aurafit.entity.ChatMessage;
import com.aurafit.entity.ChatSession;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.User;
import com.aurafit.enums.AiCallType;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.exception.AiProviderException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.ChatSessionRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.CostumeSpecification;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.stylist.StylistIntentService;
import com.aurafit.service.stylist.StylistRecommendationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class StylistRecommendationServiceImpl implements StylistRecommendationService {

    private static final int HISTORY_LIMIT = 3;
    private static final int HISTORY_FETCH_LIMIT = HISTORY_LIMIT * 2;
    private static final int RECOMMENDATION_LIMIT = 12;
    private static final int RELAXED_CANDIDATE_POOL_SIZE = 60;
    private static final int DAILY_USER_MESSAGE_LIMIT = 20;
    private static final int MIN_SEARCH_TOKEN_LENGTH = 3;
    private static final int DESCRIPTION_MAX_LENGTH = 150;
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
    private final StylistCategoryResolver stylistCategoryResolver;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public StylistRecommendationServiceImpl(
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            CostumeRepository costumeRepository,
            UserRepository userRepository,
            StylistIntentService stylistIntentService,
            StylistCategoryResolver stylistCategoryResolver,
            GeminiClient geminiClient,
            ObjectMapper objectMapper
    ) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.costumeRepository = costumeRepository;
        this.userRepository = userRepository;
        this.stylistIntentService = stylistIntentService;
        this.stylistCategoryResolver = stylistCategoryResolver;
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
            StylistFilterCriteria criteria = stylistCategoryResolver.resolve(
                    extractedCriteria,
                    userMessage
            );
            savedUserMessage.setIntentJson(serializeCriteria(criteria));
            chatMessageRepository.save(savedUserMessage);

            List<Costume> candidates = findCandidates(criteria, userMessage);

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
                        PageRequest.of(0, HISTORY_FETCH_LIMIT)
                )
                        .stream()
                        .filter(message -> message.getRole() == ChatMessageRole.USER)
                        .limit(HISTORY_LIMIT)
                        .toList()
        );
        Collections.reverse(recentMessages);
        return recentMessages;
    }

    private List<Costume> findCandidates(StylistFilterCriteria criteria, String userMessage) {
        List<Costume> strictCandidates = costumeRepository.findAll(
                CostumeSpecification.build(criteria),
                recommendationPage(RECOMMENDATION_LIMIT)
        ).getContent();
        if (!strictCandidates.isEmpty()) {
            return strictCandidates;
        }

        List<String> searchTerms = buildSearchTerms(criteria, userMessage);
        List<Costume> relaxedCandidates = costumeRepository.findAll(
                CostumeSpecification.buildRelaxed(criteria, searchTerms),
                recommendationPage(RELAXED_CANDIDATE_POOL_SIZE)
        ).getContent();

        if (relaxedCandidates.isEmpty() && StringUtils.hasText(criteria.category())) {
            StylistFilterCriteria categoryAndBudgetOnly = new StylistFilterCriteria(
                    criteria.category(),
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

        return rankCandidates(relaxedCandidates, searchTerms);
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

    private List<Costume> rankCandidates(List<Costume> candidates, List<String> searchTerms) {
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

    private String buildRecommendationPrompt(String userMessage, List<Costume> candidates) {
        StringBuilder prompt = new StringBuilder()
                .append("Yêu cầu khách hàng: ")
                .append(userMessage)
                .append("\n\nDanh sách sản phẩm được phép gợi ý:\n");

        candidates.forEach(costume -> {
            CostumeMetadata metadata = costume.getMetadata();
            prompt.append("ID: ").append(costume.getId())
                    .append(" | Tên: ").append(costume.getName())
                    .append(" | Mô tả: ").append(summarizeDescription(costume.getDescription()))
                    .append(" | Giá thuê: ").append(costume.getRentalPrice())
                    .append(" | Category: ").append(costume.getCategory().getName())
                    .append(" | Style: ").append(metadata != null ? metadata.getStyle() : "không có")
                    .append(" | Occasion: ").append(metadata != null ? metadata.getOccasion() : "không có")
                    .append(" | Season: ").append(metadata != null ? metadata.getSeason() : "không có")
                    .append(" | Color: ").append(metadata != null ? metadata.getColor() : "không có")
                    .append(" | Gender: ").append(metadata != null ? metadata.getGender() : "không có")
                    .append(" | Tags: ").append(metadata != null && metadata.getTags() != null
                            ? String.join(", ", metadata.getTags())
                            : "không có")
                    .append(" | Size: ").append(metadata != null ? metadata.getSize() : "không có")
                    .append(" | Material: ").append(metadata != null ? metadata.getMaterial() : "không có")
                    .append(" | Fit note: ").append(metadata != null ? metadata.getFitNote() : "không có")
                    .append('\n');
        });

        return prompt.toString();
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

        int contentLength = DESCRIPTION_MAX_LENGTH - 3;
        int endIndex = normalizedDescription.offsetByCodePoints(0, contentLength);
        return normalizedDescription.substring(0, endIndex).trim() + "...";
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
