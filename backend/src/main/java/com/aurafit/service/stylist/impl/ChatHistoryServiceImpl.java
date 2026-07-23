package com.aurafit.service.stylist.impl;

import com.aurafit.dto.response.CatalogCostumeDTO;
import com.aurafit.dto.response.ChatMessageDTO;
import com.aurafit.dto.response.ChatSessionDetailDTO;
import com.aurafit.dto.response.ChatSessionSummaryDTO;
import com.aurafit.entity.ChatMessage;
import com.aurafit.entity.ChatSession;
import com.aurafit.entity.Costume;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.ChatMessageRepository;
import com.aurafit.repository.ChatSessionRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.service.EventPricingService;
import com.aurafit.service.EventPricingService.ActiveEventOffer;
import com.aurafit.service.stylist.ChatHistoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ChatHistoryServiceImpl implements ChatHistoryService {

    private static final int PREVIEW_LENGTH = 40;

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CostumeRepository costumeRepository;
    private final EventPricingService eventPricingService;

    public ChatHistoryServiceImpl(
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            CostumeRepository costumeRepository,
            EventPricingService eventPricingService
    ) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.costumeRepository = costumeRepository;
        this.eventPricingService = eventPricingService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatSessionSummaryDTO> getSessionsForUser(Long userId) {
        if (userId == null) {
            return List.of();
        }

        return chatSessionRepository.findByUserIdOrderByLastMessageDesc(userId).stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ChatSessionDetailDTO getSessionDetail(String sessionId, Long userId) {
        ChatSession chatSession = findAccessibleSession(sessionId, userId);
        List<ChatMessage> messages = chatMessageRepository
                .findByChatSessionOrderByCreatedAtAsc(chatSession);
        Map<Long, CatalogCostumeDTO> costumesById = loadRecommendedCostumes(messages);

        List<ChatMessageDTO> messageDTOs = messages.stream()
                .map(message -> toMessageDTO(message, costumesById))
                .toList();

        return new ChatSessionDetailDTO(chatSession.getSessionId(), messageDTOs);
    }

    private ChatSessionSummaryDTO toSummary(ChatSession chatSession) {
        List<ChatMessage> messages = chatMessageRepository
                .findByChatSessionOrderByCreatedAtAsc(chatSession);
        String previewText = chatMessageRepository
                .findFirstByChatSessionAndRoleOrderByCreatedAtAsc(chatSession, ChatMessageRole.USER)
                .map(ChatMessage::getContent)
                .map(this::truncatePreview)
                .orElse("");
        LocalDateTime lastMessageAt = messages.isEmpty()
                ? chatSession.getCreatedAt()
                : messages.get(messages.size() - 1).getCreatedAt();

        return new ChatSessionSummaryDTO(
                chatSession.getSessionId(),
                previewText,
                lastMessageAt,
                messages.size()
        );
    }

    private ChatSession findAccessibleSession(String sessionId, Long userId) {
        if (userId != null) {
            return chatSessionRepository.findBySessionIdAndUserId(sessionId, userId)
                    .orElseThrow(() -> chatSessionNotFound(sessionId));
        }

        return chatSessionRepository.findBySessionIdAndUserIsNull(sessionId)
                .orElseThrow(() -> chatSessionNotFound(sessionId));
    }

    private ResourceNotFoundException chatSessionNotFound(String sessionId) {
        return new ResourceNotFoundException("ChatSession", "sessionId", sessionId);
    }

    private String truncatePreview(String content) {
        if (content == null) {
            return "";
        }

        int characterCount = content.codePointCount(0, content.length());
        if (characterCount <= PREVIEW_LENGTH) {
            return content;
        }

        int endIndex = content.offsetByCodePoints(0, PREVIEW_LENGTH);
        return content.substring(0, endIndex) + "...";
    }

    private Map<Long, CatalogCostumeDTO> loadRecommendedCostumes(List<ChatMessage> messages) {
        LinkedHashSet<Long> costumeIds = messages.stream()
                .filter(message -> message.getRole() == ChatMessageRole.ASSISTANT)
                .flatMap(message -> parseRecommendedCostumeIds(message.getRecommendedCostumeIds()).stream())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (costumeIds.isEmpty()) {
            return Map.of();
        }

        List<Long> recommendedCostumeIds = new ArrayList<>(costumeIds);
        Map<Long, ActiveEventOffer> offersByCostumeId = eventPricingService.findActiveOffers(
                recommendedCostumeIds,
                LocalDateTime.now()
        );

        return costumeRepository.findAllByIdWithItems(recommendedCostumeIds).stream()
                .map(costume -> toCatalogCostumeDTO(
                        costume,
                        offersByCostumeId.get(costume.getId())
                ))
                .collect(Collectors.toMap(
                        CatalogCostumeDTO::id,
                        Function.identity()
                ));
    }

    private CatalogCostumeDTO toCatalogCostumeDTO(
            Costume costume,
            ActiveEventOffer offer
    ) {
        if (offer == null) {
            return CatalogCostumeDTO.fromEntity(costume);
        }
        return CatalogCostumeDTO.fromEntity(
                costume,
                offer.discountPercent(),
                offer.finalPrice(),
                offer.eventName()
        );
    }

    private ChatMessageDTO toMessageDTO(
            ChatMessage message,
            Map<Long, CatalogCostumeDTO> costumesById
    ) {
        List<CatalogCostumeDTO> recommendedCostumes = message.getRole() == ChatMessageRole.ASSISTANT
                ? parseRecommendedCostumeIds(message.getRecommendedCostumeIds()).stream()
                        .map(costumesById::get)
                        .filter(java.util.Objects::nonNull)
                        .toList()
                : List.of();

        return new ChatMessageDTO(
                message.getId(),
                message.getRole().name(),
                message.getContent(),
                recommendedCostumes,
                message.getCreatedAt()
        );
    }

    private List<Long> parseRecommendedCostumeIds(String recommendedCostumeIds) {
        if (!StringUtils.hasText(recommendedCostumeIds)) {
            return List.of();
        }

        List<Long> parsedIds = new ArrayList<>();
        for (String rawId : recommendedCostumeIds.split(",")) {
            try {
                parsedIds.add(Long.valueOf(rawId.trim()));
            } catch (NumberFormatException ignored) {
                // Ignore stale or malformed stored IDs without breaking chat history rendering.
            }
        }
        return parsedIds;
    }
}
