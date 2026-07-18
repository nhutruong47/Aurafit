package com.aurafit.service.stylist.impl;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.ChatMessage;
import com.aurafit.enums.AiCallType;
import com.aurafit.enums.AiErrorType;
import com.aurafit.exception.AiProviderException;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.service.stylist.StylistIntentService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Slf4j
public class StylistIntentServiceImpl implements StylistIntentService {

    private static final int MAX_HISTORY_MESSAGES = 3;

    private static final String SYSTEM_PROMPT = """
            Bạn là bộ trích xuất ý định cho stylist thời trang AuraFit.
            Chỉ trả về đúng một JSON object theo schema dưới đây, không markdown, không giải thích và không thêm chữ ngoài JSON:
            {
              "category": string|null,
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
            Chỉ điền thông tin có thể xác định rõ từ lời người dùng và ngữ cảnh gần nhất.
            Field nào không xác định được thì bắt buộc để null. Không được suy đoán hoặc bịa dữ liệu.
            Giá tiền dùng số VND, không kèm ký hiệu hoặc dấu phân cách.

            Ví dụ 1:
            Input: "Mình cần đồ nữ màu đỏ để đi tiệc, ngân sách tối đa 500 nghìn"
            Output: {"category":"su-kien","style":null,"occasion":"tiệc","season":null,"color":"đỏ","gender":"nữ","tags":null,"minBudget":null,"maxBudget":500000}

            Ví dụ 2:
            Input: "Tìm trang phục cosplay phong cách dễ thương"
            Output: {"category":"cosplay","style":"dễ thương","occasion":null,"season":null,"color":null,"gender":null,"tags":null,"minBudget":null,"maxBudget":null}
            """;

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public StylistIntentServiceImpl(GeminiClient geminiClient, ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public StylistFilterCriteria extractIntent(String userMessage, List<ChatMessage> recentHistory) {
        String rawJson = geminiClient.generateJson(
                AiCallType.INTENT_EXTRACTION,
                SYSTEM_PROMPT,
                buildUserPrompt(userMessage, limitHistory(recentHistory))
        );

        try {
            if (rawJson != null) {
                rawJson = rawJson.trim();
                if (rawJson.startsWith("```json")) {
                    rawJson = rawJson.substring(7);
                } else if (rawJson.startsWith("```")) {
                    rawJson = rawJson.substring(3);
                }
                if (rawJson.endsWith("```")) {
                    rawJson = rawJson.substring(0, rawJson.length() - 3);
                }
                rawJson = rawJson.trim();
            }
            com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(rawJson);
            if (rootNode.has("intent") && rootNode.has("entities")) {
                com.fasterxml.jackson.databind.JsonNode entities = rootNode.get("entities");
                String category = entities.has("product_category") ? entities.get("product_category").asText(null) : null;
                String color = entities.has("color") ? entities.get("color").asText(null) : null;
                String gender = entities.has("gender") ? entities.get("gender").asText(null) : null;
                String style = entities.has("style") ? entities.get("style").asText(null) : null;
                return new StylistFilterCriteria(category, style, null, null, color, gender, null, null, null);
            }
            return objectMapper.treeToValue(rootNode, StylistFilterCriteria.class);
        } catch (JsonProcessingException | IllegalArgumentException exception) {
            log.error(
                    "Failed to parse Gemini intent response responseBody={}",
                    rawJson,
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
        StringBuilder prompt = new StringBuilder("Ngữ cảnh tối đa 3 tin nhắn gần nhất:\n");

        if (recentHistory.isEmpty()) {
            prompt.append("(không có)\n");
        } else {
            recentHistory.forEach(message -> prompt
                    .append(message.getRole().name())
                    .append(": ")
                    .append(message.getContent())
                    .append('\n'));
        }

        return prompt
                .append("Tin nhắn cần phân tích:\n")
                .append(userMessage)
                .toString();
    }
}
