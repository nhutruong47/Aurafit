package com.aurafit.service.stylist;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.ChatMessage;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class StylistIntentService {

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

    public StylistIntentService(GeminiClient geminiClient, ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    public StylistFilterCriteria extractIntent(String userMessage, List<ChatMessage> recentHistory) {
        String rawJson = geminiClient.generateJson(
                AiCallType.INTENT_EXTRACTION,
                SYSTEM_PROMPT,
                buildUserPrompt(userMessage, limitHistory(recentHistory))
        );

        try {
            return objectMapper.readValue(rawJson, StylistFilterCriteria.class);
        } catch (JsonProcessingException | IllegalArgumentException exception) {
            return StylistFilterCriteria.empty();
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
