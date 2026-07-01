package com.aurafit.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;
import com.aurafit.entity.AiStylistMessage;
import com.aurafit.entity.AiStylistSession;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.enums.AiStylistMessageRole;
import com.aurafit.service.AiChatContext;
import com.aurafit.service.AiChatContextBuilder;
import com.aurafit.service.AiIntentUnderstandingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AiChatContextBuilderImpl implements AiChatContextBuilder {

    private static final Logger logger = LoggerFactory.getLogger(AiChatContextBuilderImpl.class);

    private static final int RECENT_MESSAGE_LIMIT = 6;
    private static final int RECENT_MESSAGE_CONTENT_LIMIT = 160;
    private static final int SUMMARY_TEXT_LIMIT = 240;
    private static final int RECOMMENDATION_NAME_LIMIT = 3;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final TypeReference<List<Map<String, Object>>> RECOMMENDATION_SUMMARY_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {
    };
    private static final Set<String> FOLLOW_UP_HINTS = Set.of(
            "vi sao", "tai sao", "giai thich", "giai thich them", "cai nao", "mau nao",
            "nhung cai nay", "may mau nay", "so sanh", "compare", "which one",
            "why these", "why did you recommend", "why are these suitable", "best one", "these", "them"
    );

    private final ObjectMapper objectMapper;

    public AiChatContextBuilderImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public AiChatContext build(AiStylistSession session, String latestUserMessage, Map<Long, Costume> activeCostumesById) {
        AiStylistMessage previousAssistantMessage = findLatestMessageByRole(session, AiStylistMessageRole.ASSISTANT);
        AiStylistMessage previousUserMessage = findLatestMessageByRole(session, AiStylistMessageRole.USER);
        AiStylistMessage latestRecommendationMessage = findLatestRecommendationMessage(session, activeCostumesById);

        Map<String, Object> previousAssistantMetadata = previousAssistantMessage == null
                ? Map.of()
                : readAssistantMetadataMap(previousAssistantMessage.getMetadataJson());
        Map<String, Object> previousRecommendationMetadata = latestRecommendationMessage == null
                ? Map.of()
                : readAssistantMetadataMap(latestRecommendationMessage.getMetadataJson());

        List<AiChatContext.RecommendedProductContext> lastRecommendedProducts = latestRecommendationMessage == null
                ? List.of()
                : readStoredRecommendationContexts(latestRecommendationMessage.getMetadataJson(), activeCostumesById);
        List<String> lastRecommendedProductNames = lastRecommendedProducts.stream()
                .map(AiChatContext.RecommendedProductContext::productName)
                .filter(this::hasText)
                .toList();

        String previousAssistantSummary = readPreviousAssistantSummary(previousAssistantMessage, previousAssistantMetadata);
        String lastDetectedIntent = readLastDetectedIntent(previousAssistantMetadata, previousRecommendationMetadata, lastRecommendedProducts);
        String lastUserNeedSummary = readLastUserNeedSummary(previousAssistantMetadata, previousRecommendationMetadata, previousUserMessage);
        LocalDate rentalStartDate = readRecommendationDate(previousRecommendationMetadata, lastRecommendedProducts, true);
        LocalDate rentalEndDate = readRecommendationDate(previousRecommendationMetadata, lastRecommendedProducts, false);
        String rentalPeriodSummary = buildRentalPeriodSummary(rentalStartDate, rentalEndDate);
        List<AiChatContext.RecentChatMessageContext> recentMessages = buildRecentMessages(session);
        boolean likelyFollowUp = detectLikelyFollowUp(latestUserMessage, lastDetectedIntent, !lastRecommendedProducts.isEmpty());
        String availableProductSummary = lastRecommendedProductNames.isEmpty() ? null : String.join(", ", lastRecommendedProductNames);
        String conversationSummary = buildConversationSummary(
                lastUserNeedSummary,
                previousUserMessage != null ? previousUserMessage.getContent() : null,
                previousAssistantSummary,
                lastRecommendedProductNames,
                latestUserMessage,
                likelyFollowUp,
                !lastRecommendedProducts.isEmpty()
        );

        return new AiChatContext(
                latestUserMessage,
                previousUserMessage != null ? previousUserMessage.getContent() : null,
                previousAssistantSummary,
                lastDetectedIntent,
                lastUserNeedSummary,
                lastRecommendedProductNames,
                lastRecommendedProducts,
                recentMessages,
                null,
                rentalPeriodSummary,
                availableProductSummary,
                conversationSummary,
                !lastRecommendedProducts.isEmpty(),
                likelyFollowUp,
                rentalStartDate,
                rentalEndDate
        );
    }

    @Override
    public List<SimilarCostumeRecommendationDTO> readStoredRecommendations(String metadataJson, Map<Long, Costume> activeCostumesById) {
        return readStoredRecommendationContexts(metadataJson, activeCostumesById).stream()
                .map(AiChatContext.RecommendedProductContext::recommendation)
                .filter(recommendation -> recommendation != null)
                .toList();
    }

    private AiStylistMessage findLatestRecommendationMessage(AiStylistSession session, Map<Long, Costume> activeCostumesById) {
        if (session == null || session.getMessages() == null || session.getMessages().isEmpty()) {
            return null;
        }

        for (int index = session.getMessages().size() - 1; index >= 0; index--) {
            AiStylistMessage message = session.getMessages().get(index);
            if (message == null || message.getRole() != AiStylistMessageRole.ASSISTANT) {
                continue;
            }
            if (!readStoredRecommendationContexts(message.getMetadataJson(), activeCostumesById).isEmpty()) {
                return message;
            }
        }
        return null;
    }

    private AiStylistMessage findLatestMessageByRole(AiStylistSession session, AiStylistMessageRole role) {
        if (session == null || session.getMessages() == null || session.getMessages().isEmpty()) {
            return null;
        }

        for (int index = session.getMessages().size() - 1; index >= 0; index--) {
            AiStylistMessage message = session.getMessages().get(index);
            if (message != null && role == message.getRole()) {
                return message;
            }
        }
        return null;
    }

    private List<AiChatContext.RecentChatMessageContext> buildRecentMessages(AiStylistSession session) {
        if (session == null || session.getMessages() == null || session.getMessages().isEmpty()) {
            return List.of();
        }

        int fromIndex = Math.max(0, session.getMessages().size() - RECENT_MESSAGE_LIMIT);
        List<AiChatContext.RecentChatMessageContext> messages = new ArrayList<>();
        for (AiStylistMessage message : session.getMessages().subList(fromIndex, session.getMessages().size())) {
            if (message == null || message.getRole() == null || !hasText(message.getContent())) {
                continue;
            }
            messages.add(new AiChatContext.RecentChatMessageContext(
                    message.getRole().name().toLowerCase(Locale.ROOT),
                    limitText(message.getContent(), RECENT_MESSAGE_CONTENT_LIMIT)
            ));
        }
        return List.copyOf(messages);
    }

    private String readPreviousAssistantSummary(AiStylistMessage previousAssistantMessage, Map<String, Object> previousAssistantMetadata) {
        String summary = stringValue(previousAssistantMetadata.get("responseSummary"));
        if (summary == null && previousAssistantMessage != null) {
            summary = limitText(previousAssistantMessage.getContent(), SUMMARY_TEXT_LIMIT);
        }
        return summary;
    }

    private String readLastDetectedIntent(Map<String, Object> previousAssistantMetadata,
                                          Map<String, Object> previousRecommendationMetadata,
                                          List<AiChatContext.RecommendedProductContext> lastRecommendedProducts) {
        String lastDetectedIntent = stringValue(previousAssistantMetadata.get("detectedIntent"));
        if (!hasText(lastDetectedIntent)) {
            lastDetectedIntent = stringValue(previousRecommendationMetadata.get("detectedIntent"));
        }
        if (!hasText(lastDetectedIntent) && !lastRecommendedProducts.isEmpty()) {
            lastDetectedIntent = AiIntentUnderstandingService.IntentType.RECOMMENDATION_REQUEST.name();
        }
        return lastDetectedIntent;
    }

    private String readLastUserNeedSummary(Map<String, Object> previousAssistantMetadata,
                                           Map<String, Object> previousRecommendationMetadata,
                                           AiStylistMessage previousUserMessage) {
        String summary = stringValue(previousAssistantMetadata.get("lastUserNeedSummary"));
        if (!hasText(summary)) {
            summary = stringValue(previousRecommendationMetadata.get("lastUserNeedSummary"));
        }
        if (!hasText(summary) && previousUserMessage != null) {
            summary = limitText(previousUserMessage.getContent(), SUMMARY_TEXT_LIMIT);
        }
        return summary;
    }

    private String buildConversationSummary(String lastUserNeedSummary,
                                            String previousUserMessage,
                                            String previousAssistantSummary,
                                            List<String> lastRecommendedProductNames,
                                            String latestUserMessage,
                                            boolean likelyFollowUp,
                                            boolean hasPreviousRecommendation) {
        List<String> parts = new ArrayList<>();
        if (hasText(lastUserNeedSummary)) {
            parts.add("Previous user need: " + limitText(lastUserNeedSummary, SUMMARY_TEXT_LIMIT) + ".");
        } else if (hasText(previousUserMessage)) {
            parts.add("Previous user message: " + limitText(previousUserMessage, SUMMARY_TEXT_LIMIT) + ".");
        }

        if (hasPreviousRecommendation && !lastRecommendedProductNames.isEmpty()) {
            parts.add("Assistant recommended: " + String.join(", ", lastRecommendedProductNames.stream()
                    .limit(RECOMMENDATION_NAME_LIMIT)
                    .toList()) + ".");
        } else if (hasText(previousAssistantSummary)) {
            parts.add("Previous assistant summary: " + limitText(previousAssistantSummary, SUMMARY_TEXT_LIMIT) + ".");
        }

        if (hasText(latestUserMessage) && likelyFollowUp) {
            parts.add(hasPreviousRecommendation
                    ? "Latest message appears to ask about the previous recommendations."
                    : "Latest message appears to be a follow-up, but previous recommendation context is missing.");
        }

        return parts.isEmpty() ? null : String.join(" ", parts);
    }

    private boolean detectLikelyFollowUp(String latestUserMessage, String lastDetectedIntent, boolean hasPreviousRecommendation) {
        if (!hasText(latestUserMessage)) {
            return false;
        }

        String normalized = latestUserMessage.trim().toLowerCase(Locale.ROOT);
        boolean directHint = FOLLOW_UP_HINTS.stream().anyMatch(normalized::contains);
        if (!directHint) {
            return false;
        }

        return hasPreviousRecommendation
                || AiIntentUnderstandingService.IntentType.RECOMMENDATION_REQUEST.name().equalsIgnoreCase(lastDetectedIntent)
                || AiIntentUnderstandingService.IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP.name().equalsIgnoreCase(lastDetectedIntent)
                || normalized.length() <= 60;
    }

    private String buildRentalPeriodSummary(LocalDate rentalStartDate, LocalDate rentalEndDate) {
        if (rentalStartDate == null || rentalEndDate == null) {
            return null;
        }
        return rentalStartDate.format(DATE_FORMATTER) + " to " + rentalEndDate.format(DATE_FORMATTER);
    }

    private List<AiChatContext.RecommendedProductContext> readStoredRecommendationContexts(String metadataJson,
                                                                                           Map<Long, Costume> activeCostumesById) {
        if (!hasText(metadataJson)) {
            return List.of();
        }

        try {
            List<Map<String, Object>> summaries = readRecommendationSummaries(metadataJson);
            if (summaries.isEmpty()) {
                return List.of();
            }

            List<AiChatContext.RecommendedProductContext> recommendations = new ArrayList<>();
            for (Map<String, Object> summary : summaries) {
                Long costumeId = parseLong(summary.get("costumeId"));
                if (costumeId == null || activeCostumesById == null) {
                    continue;
                }

                Costume costume = activeCostumesById.get(costumeId);
                if (costume == null) {
                    continue;
                }

                int availableItemCount = intValue(summary.get("availableItemCount"));
                if (availableItemCount <= 0) {
                    continue;
                }

                String reason = stringValue(summary.get("reason"));
                int score = intValue(summary.get("score"));
                LocalDate rentalStartDate = parseLocalDate(summary.get("rentalStartDate"));
                LocalDate rentalEndDate = parseLocalDate(summary.get("rentalEndDate"));
                CostumeMetadata metadata = costume.getMetadata();
                SimilarCostumeRecommendationDTO recommendation = SimilarCostumeRecommendationDTO.fromEntity(
                        costume,
                        reason,
                        score,
                        availableItemCount
                );

                recommendations.add(new AiChatContext.RecommendedProductContext(
                        costume.getId(),
                        costume.getName(),
                        costume.getRentalPrice(),
                        reason,
                        score,
                        costume.getCategory() != null ? costume.getCategory().getName() : null,
                        stringValue(summary.getOrDefault("style", metadata != null ? metadata.getStyle() : null)),
                        stringValue(summary.getOrDefault("occasion", metadata != null ? metadata.getOccasion() : null)),
                        stringValue(summary.getOrDefault("season", metadata != null ? metadata.getSeason() : null)),
                        stringValue(summary.getOrDefault("color", metadata != null ? metadata.getColor() : null)),
                        readTags(summary.get("tags"), metadata),
                        availableItemCount,
                        rentalStartDate,
                        rentalEndDate,
                        recommendation
                ));
            }
            return List.copyOf(recommendations);
        } catch (Exception exception) {
            logger.warn("Cannot parse AI stylist recommendation metadata: {}", summarize(exception));
            return List.of();
        }
    }

    private List<Map<String, Object>> readRecommendationSummaries(String metadataJson) throws Exception {
        JsonNode root = objectMapper.readTree(metadataJson.trim());
        if (root == null || root.isNull()) {
            return List.of();
        }
        if (root.isArray()) {
            return objectMapper.convertValue(root, RECOMMENDATION_SUMMARY_TYPE);
        }
        if (root.isObject()) {
            JsonNode recommendationsNode = root.path("recommendations");
            if (recommendationsNode.isArray()) {
                return objectMapper.convertValue(recommendationsNode, RECOMMENDATION_SUMMARY_TYPE);
            }
        }
        return List.of();
    }

    private Map<String, Object> readAssistantMetadataMap(String metadataJson) {
        if (!hasText(metadataJson)) {
            return Map.of();
        }

        try {
            JsonNode root = objectMapper.readTree(metadataJson.trim());
            if (root != null && root.isObject()) {
                return objectMapper.convertValue(root, METADATA_TYPE);
            }
        } catch (Exception exception) {
            logger.warn("Cannot parse AI stylist assistant metadata: {}", summarize(exception));
        }
        return Map.of();
    }

    private LocalDate readRecommendationDate(Map<String, Object> metadata,
                                             List<AiChatContext.RecommendedProductContext> recommendations,
                                             boolean startDate) {
        LocalDate rootDate = parseLocalDate(metadata.get(startDate ? "rentalStartDate" : "rentalEndDate"));
        if (rootDate != null) {
            return rootDate;
        }
        return recommendations.stream()
                .map(item -> startDate ? item.rentalStartDate() : item.rentalEndDate())
                .filter(date -> date != null)
                .findFirst()
                .orElse(null);
    }

    private List<String> readTags(Object rawTags, CostumeMetadata metadata) {
        if (rawTags instanceof List<?> list) {
            return list.stream()
                    .filter(value -> value != null && hasText(value.toString()))
                    .map(Object::toString)
                    .toList();
        }
        if (rawTags instanceof String text && hasText(text)) {
            return List.of(text.split(","));
        }
        return metadata != null && metadata.getTags() != null ? List.copyOf(metadata.getTags()) : List.of();
    }

    private String limitText(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength).trim();
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.toString().trim();
        return trimmed.isEmpty() ? null : trimmed;
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

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String summarize(Exception exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? exception.getClass().getSimpleName() : message;
    }
}
