package com.aurafit.service.impl;

import com.aurafit.service.AiProviderClient;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiPromptTemplateService {

    private static final String TEMPLATE_PATH = "ai/prompt-template.md";
    private static final String INTENT_UNDERSTANDING_PATH = "ai/system/intent-understanding.md";
    private static final String STYLIST_SYSTEM_PATH = "ai/system/stylist-system.md";
    private static final String RECOMMENDATION_REASONING_PATH = "ai/system/recommendation-reasoning.md";
    private static final String LANGUAGE_POLICY_PATH = "ai/system/language-policy.md";
    private static final String INTENT_POLICY_PATH = "ai/system/intent-policy.md";
    private static final String RECOMMENDATION_POLICY_PATH = "ai/system/recommendation-policy.md";
    private static final String OUTPUT_FORMAT_PATH = "ai/system/output-format.md";
    private static final String SAFETY_POLICY_PATH = "ai/system/safety-policy.md";
    private static final String FASHION_GUIDELINE_PATH = "ai/knowledge/fashion-guideline.md";
    private static final String COLOR_COMBINATION_PATH = "ai/knowledge/color-combination.md";
    private static final String RENTAL_GUIDELINE_PATH = "ai/knowledge/rental-guideline.md";
    private static final String EVENT_DRESS_GUIDE_PATH = "ai/knowledge/event-dress-guide.md";
    private static final String COSPLAY_GUIDE_PATH = "ai/knowledge/cosplay-guide.md";
    private static final Set<String> FORMAL_INTENT_KEYWORDS = Set.of(
            "da hoi", "dạ hội", "evening", "formal", "gown", "prom", "tuxedo", "vest", "suit", "vay tiec", "dam tiec"
    );
    private static final Set<String> COSPLAY_INTENT_KEYWORDS = Set.of(
            "cosplay", "anime", "manga", "game", "fantasy", "halloween"
    );
    private static final Set<String> WEDDING_INTENT_KEYWORDS = Set.of(
            "dam cuoi", "đám cưới", "wedding", "cuoi hoi", "an hoi", "bridesmaid"
    );
    private static final Set<String> YEARBOOK_INTENT_KEYWORDS = Set.of(
            "ky yeu", "kỷ yếu", "yearbook", "graduation", "portrait"
    );
    private static final Pattern RENTAL_PERIOD_PATTERN =
            Pattern.compile("(\\d{4}-\\d{2}-\\d{2}\\s*(?:to|đến|den)\\s*\\d{4}-\\d{2}-\\d{2})", Pattern.CASE_INSENSITIVE);

    private final AiPromptResourceService promptResourceService;

    public AiPromptTemplateService(AiPromptResourceService promptResourceService) {
        this.promptResourceService = promptResourceService;
    }

    public String composeRecommendationExplanationSystemPrompt(AiProviderClient.RecommendationExplanationPrompt prompt) {
        Map<String, String> placeholders = new LinkedHashMap<>();
        placeholders.put("stylistSystem", section(STYLIST_SYSTEM_PATH, fallbackStylistSystem()));
        placeholders.put("languagePolicy", section(LANGUAGE_POLICY_PATH, fallbackLanguagePolicy()));
        placeholders.put("intentPolicy", section(INTENT_POLICY_PATH, fallbackIntentPolicy()));
        placeholders.put("recommendationPolicy", section(RECOMMENDATION_POLICY_PATH, fallbackRecommendationPolicy()));
        placeholders.put("outputFormat", section(OUTPUT_FORMAT_PATH, fallbackOutputFormat()));
        placeholders.put("safetyPolicy", section(SAFETY_POLICY_PATH, fallbackSafetyPolicy()));
        placeholders.put("fashionGuideline", section(FASHION_GUIDELINE_PATH, fallbackFashionGuideline()));
        placeholders.put("colorCombination", section(COLOR_COMBINATION_PATH, fallbackColorCombination()));
        placeholders.put("rentalGuideline", section(RENTAL_GUIDELINE_PATH, fallbackRentalGuideline()));
        placeholders.put("eventDressGuide", section(EVENT_DRESS_GUIDE_PATH, fallbackEventDressGuide()));
        placeholders.put("cosplayGuide", section(COSPLAY_GUIDE_PATH, fallbackCosplayGuide()));
        placeholders.put("userId", "N/A");
        placeholders.put("sessionId", "N/A");
        placeholders.put("conversationContext", buildConversationContext(prompt.chatContext()));
        placeholders.put("recentMessages", buildRecentMessages(prompt.chatContext()));
        placeholders.put("lastRecommendations", buildLastRecommendations(prompt.chatContext()));
        placeholders.put("userMessage", safe(prompt.userMessageExcerpt(), "N/A"));
        placeholders.put("detectedIntent", safe(prompt.detectedIntentJson(), "N/A"));
        placeholders.put("rentalPeriod", extractRentalPeriod(prompt.contextSummary()));
        placeholders.put("availableProducts", buildAvailableProducts(prompt.items()));
        placeholders.put("userInteractions", safe(prompt.contextSummary(), "N/A"));

        String template = promptResourceService.loadPromptContent(TEMPLATE_PATH, fallbackTemplate());
        String resolvedTemplate = applyPlaceholders(template, placeholders);

        return resolvedTemplate + """

[Current Task]
You are rewriting recommendation reasons for products that were already ranked by backend logic.
Do not change ranking or invent products.
Use only the products listed in [Runtime Context].
Return a raw JSON array only, where each item has the form:
{"costumeId":123,"reason":"..."}
Do not add markdown or extra explanation outside the JSON array.
""";
    }

    public String composeIntentUnderstandingSystemPrompt() {
        return promptResourceService.loadPromptContent(INTENT_UNDERSTANDING_PATH, fallbackIntentUnderstandingPrompt());
    }

    public String composeRecommendationReasoningSystemPrompt() {
        return promptResourceService.loadPromptContent(
                RECOMMENDATION_REASONING_PATH,
                fallbackRecommendationReasoningPrompt()
        );
    }

    private String section(String path, String fallbackContent) {
        return promptResourceService.loadPromptContent(path, fallbackContent);
    }

    private String applyPlaceholders(String template, Map<String, String> placeholders) {
        String resolved = template;
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            resolved = resolved.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return resolved;
    }

    private String buildAvailableProducts(List<AiProviderClient.RecommendationExplanationItem> items) {
        if (items == null || items.isEmpty()) {
            return "N/A";
        }

        StringBuilder builder = new StringBuilder();
        for (AiProviderClient.RecommendationExplanationItem item : items) {
            builder.append("- costumeId=")
                    .append(item.costumeId() != null ? item.costumeId() : "N/A")
                    .append(", name=").append(safe(item.costumeName(), "N/A"))
                    .append(", category=").append(safe(item.categoryName(), "N/A"))
                    .append(", style=").append(safe(item.style(), "N/A"))
                    .append(", occasion=").append(safe(item.occasion(), "N/A"))
                    .append(", season=").append(safe(item.season(), "N/A"))
                    .append(", color=").append(safe(item.color(), "N/A"))
                    .append(", availableItemCount=").append(item.availableItemCount())
                    .append(", originalReason=").append(safe(item.originalReason(), "N/A"))
                    .append(System.lineSeparator());
        }
        return builder.toString().trim();
    }

    private String buildConversationContext(com.aurafit.service.AiChatContext chatContext) {
        if (chatContext == null || !hasText(chatContext.conversationSummary())) {
            return "N/A";
        }
        return chatContext.conversationSummary().trim();
    }

    private String buildRecentMessages(com.aurafit.service.AiChatContext chatContext) {
        if (chatContext == null || chatContext.recentMessages().isEmpty()) {
            return "N/A";
        }

        StringBuilder builder = new StringBuilder();
        for (com.aurafit.service.AiChatContext.RecentChatMessageContext message : chatContext.recentMessages()) {
            builder.append("- ")
                    .append(safe(message.role(), "unknown"))
                    .append(": ")
                    .append(safe(message.content(), ""))
                    .append(System.lineSeparator());
        }
        return builder.toString().trim();
    }

    private String buildLastRecommendations(com.aurafit.service.AiChatContext chatContext) {
        if (chatContext == null || chatContext.lastRecommendedProducts().isEmpty()) {
            return "N/A";
        }

        StringBuilder builder = new StringBuilder();
        for (com.aurafit.service.AiChatContext.RecommendedProductContext recommendation : chatContext.lastRecommendedProducts()) {
            builder.append("- name=").append(safe(recommendation.productName(), "N/A"))
                    .append(", category=").append(safe(recommendation.category(), "N/A"))
                    .append(", style=").append(safe(recommendation.style(), "N/A"))
                    .append(", occasion=").append(safe(recommendation.occasion(), "N/A"))
                    .append(", color=").append(safe(recommendation.color(), "N/A"))
                    .append(", score=").append(recommendation.score() != null ? recommendation.score() : 0)
                    .append(", reason=").append(safe(recommendation.reason(), "N/A"))
                    .append(System.lineSeparator());
        }
        return builder.toString().trim();
    }

    private String extractRentalPeriod(String contextSummary) {
        if (contextSummary == null || contextSummary.isBlank()) {
            return "N/A";
        }

        Matcher matcher = RENTAL_PERIOD_PATTERN.matcher(contextSummary);
        return matcher.find() ? matcher.group(1).trim() : "N/A";
    }

    private String safe(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String fallbackTemplate() {
        return """
[System Identity]
{{stylistSystem}}

[Language Policy]
{{languagePolicy}}

[Intent Policy]
{{intentPolicy}}

[Recommendation Policy]
{{recommendationPolicy}}

[Output Format]
{{outputFormat}}

[Safety Policy]
{{safetyPolicy}}

[Knowledge Base]
{{fashionGuideline}}
{{colorCombination}}
{{rentalGuideline}}
{{eventDressGuide}}
{{cosplayGuide}}

[Runtime Context]
User ID: {{userId}}
Session ID: {{sessionId}}

[Conversation Context]
{{conversationContext}}

[Recent Messages]
{{recentMessages}}

[Last Recommendations]
{{lastRecommendations}}

[Latest User Message - Highest Priority]
{{userMessage}}

[Detected Intent]
{{detectedIntent}}

[Response Mode Instruction]
Only recommend products if the detected intent is RECOMMENDATION_REQUEST.
For CASUAL_CHAT, RENTAL_SUPPORT, PRODUCT_QUESTION, or OUT_OF_SCOPE, answer directly without forcing product recommendations.

Rental period: {{rentalPeriod}}

[Available Products Matching Latest Intent]
{{availableProducts}}

[User Interaction History - Personalization Only]
{{userInteractions}}

[Instruction]
Answer the user's latest message using the policies above.
""";
    }

    private String fallbackStylistSystem() {
        return """
Bạn là AuraFit AI Stylist, hỗ trợ người dùng chọn trang phục thuê phù hợp từ catalog thực tế.
Không bịa sản phẩm không có trong hệ thống.
Ưu tiên sản phẩm còn sẵn và phù hợp với thời gian thuê khi có dữ liệu.
""";
    }

    private String fallbackLanguagePolicy() {
        return """
Luôn trả lời theo ngôn ngữ mà người dùng vừa sử dụng.
Nếu người dùng viết tiếng Việt không dấu, hãy trả lời bằng tiếng Việt tự nhiên có dấu.
Không cố tình trả lời bằng tiếng Việt không dấu.
""";
    }

    private String fallbackIntentPolicy() {
        return """
Always classify the latest user message before deciding response mode.
Only RECOMMENDATION_REQUEST should trigger product recommendation flow.
CASUAL_CHAT, RENTAL_SUPPORT, PRODUCT_QUESTION, and OUT_OF_SCOPE should be answered directly without forcing product recommendations.
""";
    }

    private String fallbackRecommendationPolicy() {
        return """
Ưu tiên availability theo rental period, nhu cầu người dùng trong chat, metadata sản phẩm và hành vi gần đây.
Không recommend sản phẩm không available và không bịa thông tin ngoài dữ liệu.
Nếu dữ liệu chưa đủ, hãy hỏi thêm occasion, size, màu sắc hoặc ngày thuê.
""";
    }

    private String fallbackOutputFormat() {
        return """
Trả lời ngắn gọn, thân thiện và bám sát tên sản phẩm có trong context.
Không tự tạo tên sản phẩm ngoài context.
""";
    }

    private String fallbackSafetyPolicy() {
        return """
Không tạo nội dung xúc phạm, phân biệt hoặc vượt quá phạm vi tư vấn thời trang và thuê trang phục.
Nếu câu hỏi ngoài phạm vi, từ chối lịch sự và kéo lại nhu cầu trang phục khi phù hợp.
""";
    }

    private String fallbackFashionGuideline() {
        return "Ưu tiên lời khuyên thời trang cơ bản theo sự kiện, mùa và độ phù hợp khi thuê trang phục.";
    }

    private String fallbackColorCombination() {
        return "Ưu tiên phối màu an toàn, dễ mặc và phù hợp với bối cảnh sự kiện nếu người dùng chưa nêu rõ sở thích.";
    }

    private String fallbackRentalGuideline() {
        return "Nhắc người dùng kiểm tra ngày thuê, size và tình trạng sản phẩm; không cam kết giữ đồ nếu backend chưa xác nhận.";
    }

    private String fallbackEventDressGuide() {
        return "Nếu người dùng nêu sự kiện cụ thể, hãy ưu tiên trang phục phù hợp với tính chất sự kiện đó.";
    }

    private String fallbackCosplayGuide() {
        return "Với cosplay, ưu tiên độ thoải mái, size phù hợp, chiều cao và mức độ dễ di chuyển.";
    }

    private String fallbackIntentUnderstandingPrompt() {
        return """
You are the AuraFit intent-understanding layer.
Read the latest user message together with short conversation context and return exactly one JSON object.

Supported intents:
- CASUAL_CHAT
- RECOMMENDATION_REQUEST
- RECOMMENDATION_EXPLANATION_FOLLOW_UP
- PRODUCT_QUESTION
- RENTAL_SUPPORT
- OUT_OF_SCOPE

Supported languages:
- vi
- en

Return this schema only:
{
  "intent":"RECOMMENDATION_REQUEST",
  "isFollowUp":false,
  "refersToPreviousRecommendations":false,
  "confidence":0.97,
  "language":"vi",
  "occasion":"wedding",
  "style":"formal",
  "color":null,
  "gender":null,
  "size":null,
  "budget":null,
  "rentalDate":null,
  "productMentioned":null
}

Rules:
- You will receive conversation context fields in the user payload:
  - latestUserMessage
  - previousUserMessage
  - previousAssistantSummary
  - lastDetectedIntent
  - lastUserNeedSummary
  - lastRecommendedProducts
  - recentMessages
  - conversationSummary
  - hasPreviousRecommendation
  - likelyFollowUp
- Use that context when the latest message is a follow-up about previous recommendations.
- If the latest message asks why certain suggested items fit, asks to compare them, or asks which one is best, use RECOMMENDATION_EXPLANATION_FOLLOW_UP.
- If previous recommendation context is missing but the latest message is clearly a short follow-up such as "giải thích thêm đi" or "why these", still prefer RECOMMENDATION_EXPLANATION_FOLLOW_UP over OUT_OF_SCOPE.
- Output raw JSON only.
- Do not output markdown.
- Do not explain.
- Use null for missing fields.
- confidence must be between 0 and 1.
- language must be "vi" or "en".
""";
    }

    private String fallbackRecommendationReasoningPrompt() {
        return """
Bạn là AuraFit AI Stylist cho lớp reasoning recommendation nội bộ.
Chỉ được chọn costume trong candidatePool.
Không được bịa costume ngoài candidatePool.
Nếu yêu cầu mơ hồ, trả clarificationNeeded thay vì đoán bừa.
Nếu không có candidate nào thực sự phù hợp, trả noMatchReason thay vì ép chọn 3 item.
Output chỉ được là JSON hợp lệ theo schema đã cung cấp.
""";
    }
}
