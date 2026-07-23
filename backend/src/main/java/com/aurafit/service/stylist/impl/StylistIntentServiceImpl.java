package com.aurafit.service.stylist.impl;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.ChatMessage;
import com.aurafit.enums.AiCallType;
import com.aurafit.enums.AiErrorType;
import com.aurafit.enums.ChatMessageRole;
import com.aurafit.exception.AiProviderException;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.service.stylist.StylistIntentService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Slf4j
public class StylistIntentServiceImpl implements StylistIntentService {

    private static final int MAX_HISTORY_MESSAGES = 6;
    private static final int HISTORY_MESSAGE_MAX_LENGTH = 500;

    private static final String SYSTEM_PROMPT = """
            Bạn là bộ trích xuất ý định cho stylist thời trang AuraFit.
            Chỉ trả về đúng một JSON object theo schema dưới đây, không markdown, không giải thích và không thêm chữ ngoài JSON:
            {
              "category": string|null,
              "requestedItem": string|null,
              "style": string|null,
              "occasion": string|null,
              "season": string|null,
              "color": string|null,
              "gender": string|null,
              "tags": array<string>|null,
              "minBudget": number|null,
              "maxBudget": number|null
            }

            category phải là category path dạng slug tiếng Việt không dấu, ví dụ "su-kien" hoặc "cosplay".
            Nếu không chắc category path tồn tại trong AuraFit thì để null, không tự tạo path mới.
            requestedItem là loại mặt hàng cốt lõi khách đang yêu cầu rõ ràng, ví dụ "bikini", "áo dài", "váy cưới"; không kèm màu sắc, phong cách hoặc giới tính.
            requestedItem vẫn phải được ghi nhận kể cả khi mặt hàng hoặc category đó có thể chưa tồn tại trong AuraFit.
            Chỉ điền requestedItem khi tin nhắn hiện tại trực tiếp nhắc hoặc yêu cầu mặt hàng; không kế thừa requestedItem từ lịch sử.
            Chỉ điền thông tin có thể xác định rõ từ lời người dùng và ngữ cảnh gần nhất.
            Chỉ kế thừa field từ lịch sử khi tin hiện tại thực sự là câu hỏi nối tiếp.
            Nếu tin hiện tại đã nêu rõ sản phẩm hoặc nhu cầu mới, không mang occasion, color, style hay tags cũ sang.
            Field nào không xác định được thì bắt buộc để null. Không được suy đoán hoặc bịa dữ liệu.
            Giá tiền dùng số VND, không kèm ký hiệu hoặc dấu phân cách.

            Ví dụ 1:
            Input: "Mình cần đồ nữ màu đỏ để đi tiệc, ngân sách tối đa 500 nghìn"
            Output: {"category":"su-kien","requestedItem":null,"style":null,"occasion":"tiệc","season":null,"color":"đỏ","gender":"nữ","tags":null,"minBudget":null,"maxBudget":500000}

            Ví dụ 2:
            Input: "Tìm trang phục cosplay phong cách dễ thương"
            Output: {"category":"cosplay","requestedItem":null,"style":"dễ thương","occasion":null,"season":null,"color":null,"gender":null,"tags":null,"minBudget":null,"maxBudget":null}

            Ví dụ 3:
            Input: "Shop có bikini không?"
            Output: {"category":null,"requestedItem":"bikini","style":null,"occasion":null,"season":null,"color":null,"gender":null,"tags":null,"minBudget":null,"maxBudget":null}
            """;

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public StylistIntentServiceImpl(GeminiClient geminiClient, ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public StylistFilterCriteria extractIntent(String userMessage, List<ChatMessage> recentHistory) {
        String userPrompt = buildUserPrompt(userMessage, limitHistory(recentHistory));
        String rawJson = geminiClient.generateJson(
                AiCallType.INTENT_EXTRACTION,
                SYSTEM_PROMPT,
                userPrompt
        );

        try {
            return parseIntent(rawJson);
        } catch (JsonProcessingException | IllegalArgumentException exception) {
            log.warn("Gemini returned malformed intent JSON; retrying once responseBody={}", rawJson);
        }

        String retryRawJson = geminiClient.generateJson(
                AiCallType.INTENT_EXTRACTION,
                SYSTEM_PROMPT,
                userPrompt + "\nHãy trả lại đúng một JSON object hợp lệ theo schema, không thêm nội dung khác."
        );
        try {
            return parseIntent(retryRawJson);
        } catch (JsonProcessingException | IllegalArgumentException exception) {
            log.error(
                    "Failed to parse Gemini intent response after retry responseBody={}",
                    retryRawJson,
                    exception
            );
            throw new AiProviderException(
                    AiErrorType.INVALID_RESPONSE,
                    exception.getMessage(),
                    "Có chút trục trặc khi xử lý câu trả lời, bạn thử hỏi lại theo cách khác nhé",
                    exception
            );
        }
    }

    private StylistFilterCriteria parseIntent(String rawJson) throws JsonProcessingException {
        String normalizedJson = stripMarkdownFence(rawJson);
        com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(normalizedJson);
        if (rootNode == null || !rootNode.isObject()) {
            throw new IllegalArgumentException("Intent response must be a JSON object.");
        }
        if (rootNode.has("intent") && rootNode.has("entities")) {
            com.fasterxml.jackson.databind.JsonNode entities = rootNode.get("entities");
            String category = entities.has("product_category") ? entities.get("product_category").asText(null) : null;
            String color = entities.has("color") ? entities.get("color").asText(null) : null;
            String gender = entities.has("gender") ? entities.get("gender").asText(null) : null;
            String style = entities.has("style") ? entities.get("style").asText(null) : null;
            String requestedItem = entities.has("requested_item")
                    ? entities.get("requested_item").asText(null)
                    : null;
            return new StylistFilterCriteria(
                    category,
                    requestedItem,
                    style,
                    null,
                    null,
                    color,
                    gender,
                    null,
                    null,
                    null
            );
        }
        return objectMapper.treeToValue(rootNode, StylistFilterCriteria.class);
    }

    private String stripMarkdownFence(String rawJson) {
        if (rawJson == null) {
            return null;
        }
        String normalizedJson = rawJson.trim();
        if (normalizedJson.startsWith("```json")) {
            normalizedJson = normalizedJson.substring(7);
        } else if (normalizedJson.startsWith("```")) {
            normalizedJson = normalizedJson.substring(3);
        }
        if (normalizedJson.endsWith("```")) {
            normalizedJson = normalizedJson.substring(0, normalizedJson.length() - 3);
        }
        return normalizedJson.trim();
    }

    private List<ChatMessage> limitHistory(List<ChatMessage> recentHistory) {
        if (recentHistory == null || recentHistory.isEmpty()) {
            return List.of();
        }

        List<ChatMessage> sortedHistory = new ArrayList<>(recentHistory);
        sortedHistory.sort(Comparator.comparing(
                ChatMessage::getCreatedAt,
                Comparator.nullsFirst(LocalDateTime::compareTo)
        ));

        int fromIndex = Math.max(0, sortedHistory.size() - MAX_HISTORY_MESSAGES);
        return List.copyOf(sortedHistory.subList(fromIndex, sortedHistory.size()));
    }

    private String buildUserPrompt(String userMessage, List<ChatMessage> recentHistory) {
        StringBuilder prompt = new StringBuilder("Ngữ cảnh 3 lượt hội thoại gần nhất, theo thứ tự cũ đến mới:\n");

        if (recentHistory.isEmpty()) {
            prompt.append("(không có)\n");
        } else {
            recentHistory.forEach(message -> {
                String speaker = message.getRole() == ChatMessageRole.USER
                        ? "Khách hàng"
                        : "Stylist";
                prompt.append(speaker)
                        .append(": ")
                        .append(summarizeHistoryMessage(message.getContent()));
                if (message.getRole() == ChatMessageRole.ASSISTANT
                        && StringUtils.hasText(message.getRecommendedCostumeIds())) {
                    prompt.append(" [ID sản phẩm đã gợi ý: ")
                            .append(message.getRecommendedCostumeIds().trim())
                            .append(']');
                }
                prompt.append('\n');
            });
        }

        return prompt
                .append("Tin nhắn cần phân tích:\n")
                .append(userMessage)
                .toString();
    }

    private String summarizeHistoryMessage(String content) {
        if (!StringUtils.hasText(content)) {
            return "(trống)";
        }
        String normalized = content.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= HISTORY_MESSAGE_MAX_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, HISTORY_MESSAGE_MAX_LENGTH - 3).trim() + "...";
    }
}
