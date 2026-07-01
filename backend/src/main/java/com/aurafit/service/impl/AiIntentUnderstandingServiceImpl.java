package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.service.AiChatContext;
import com.aurafit.service.AiIntentUnderstandingService;
import com.aurafit.service.AiProviderClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiIntentUnderstandingServiceImpl implements AiIntentUnderstandingService {

    private static final Logger logger = LoggerFactory.getLogger(AiIntentUnderstandingServiceImpl.class);

    private static final Pattern NORMALIZE_TEXT_PATTERN = Pattern.compile("[^\\p{L}\\p{N}\\s-]");
    private static final Pattern VIETNAMESE_ACCENT_PATTERN = Pattern.compile("[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]", Pattern.CASE_INSENSITIVE);
    private static final Pattern SIZE_PATTERN = Pattern.compile("(?<![\\p{L}\\p{N}])(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl)(?![\\p{L}\\p{N}])", Pattern.CASE_INSENSITIVE);
    private static final Pattern BUDGET_PATTERN = Pattern.compile("(\\d+[\\d.,]*)\\s*(tr|trieu|k|nghin|ngan|vnd|d)?", Pattern.CASE_INSENSITIVE);
    private static final Pattern ISO_DATE_PATTERN = Pattern.compile("\\b\\d{4}-\\d{2}-\\d{2}\\b");

    private static final Set<String> VI_LANGUAGE_HINTS = Set.of(
            "ao", "ban", "bo", "can", "cho", "co", "con", "de", "dip", "do", "du", "gia", "giu", "hoi",
            "khong", "lich", "mau", "minh", "muon", "nay", "size", "su", "thue", "tiec", "toi", "tuan", "vang"
    );
    private static final Set<String> EN_LANGUAGE_HINTS = Set.of(
            "a", "an", "budget", "color", "costume", "delivery", "deposit", "dress", "elegant", "for",
            "hello", "help", "hi", "need", "outfit", "party", "price", "prom", "recommend", "rent",
            "return", "size", "thanks", "wedding", "why", "compare", "which"
    );

    private static final Set<String> CASUAL_CHAT_PHRASES = Set.of(
            "hi", "hello", "hey", "xin chao", "chao", "ban khoe khong", "khoe khong", "how are you",
            "ban la ai", "who are you", "cam on", "thanks", "thank you", "good morning", "good evening"
    );
    private static final Set<String> RENTAL_SUPPORT_PHRASES = Set.of(
            "dat coc", "deposit", "tra do", "return", "phi phat", "late fee", "giao hang", "delivery",
            "ship", "thanh toan", "payment", "chinh sach", "giu do"
    );
    private static final Set<String> PRODUCT_DETAIL_PHRASES = Set.of(
            "size", "mau", "color", "gia", "price", "con khong", "con hang", "available", "availability",
            "bao nhieu", "co mau", "co size", "san pham nay", "bo nay", "vay nay", "costume nay", "this product",
            "this costume", "this outfit", "this one"
    );
    private static final Set<String> PRODUCT_REFERENCE_PHRASES = Set.of(
            "san pham nay", "bo nay", "vay nay", "costume nay", "do nay", "item nay",
            "this product", "this costume", "this outfit", "this one"
    );
    private static final Set<String> RECOMMENDATION_REQUEST_PHRASES = Set.of(
            "goi y", "recommend", "suggest", "thue do", "chon do", "mac gi", "nen mac", "outfit",
            "phoi do", "prom", "cosplay", "dam cuoi", "tiec cuoi", "chup anh", "wedding", "elegant outfit"
    );
    private static final Set<String> FOLLOW_UP_EXPLANATION_PHRASES = Set.of(
            "vi sao", "tai sao", "giai thich", "giai thich them", "phu hop voi nhu cau",
            "tai sao lai goi y", "nhung cai nay", "cac mau nay", "cac bo nay",
            "why are these suitable", "why did you recommend these", "why these", "explain more"
    );
    private static final Set<String> FOLLOW_UP_COMPARISON_PHRASES = Set.of(
            "cai nao hop nhat", "mau nao nen chon", "so sanh cac mau nay", "so sanh",
            "cai nao nen chon", "which one is best", "which one best", "which one should i choose",
            "compare these", "compare them", "best one"
    );
    private static final Set<String> FOLLOW_UP_REFERENCES = Set.of(
            "nhung cai nay", "cac mau nay", "cac bo nay", "nhung mau nay", "nhung bo nay",
            "these", "those", "cai nao", "mau nao"
    );

    private static final LinkedHashMap<String, Set<String>> OCCASION_ALIASES = new LinkedHashMap<>();
    private static final LinkedHashMap<String, Set<String>> STYLE_ALIASES = new LinkedHashMap<>();
    private static final LinkedHashMap<String, Set<String>> COLOR_ALIASES = new LinkedHashMap<>();
    private static final LinkedHashMap<String, Set<String>> GENDER_ALIASES = new LinkedHashMap<>();

    static {
        OCCASION_ALIASES.put("wedding", Set.of("dam cuoi", "di cuoi", "tiec cuoi", "wedding", "cuoi hoi", "an hoi", "bridesmaid"));
        OCCASION_ALIASES.put("prom", Set.of("prom"));
        OCCASION_ALIASES.put("yearbook", Set.of("ky yeu", "yearbook", "graduation"));
        OCCASION_ALIASES.put("cosplay", Set.of("cosplay", "anime", "manga", "character"));
        OCCASION_ALIASES.put("photoshoot", Set.of("chup anh", "photoshoot", "portrait", "concept"));
        OCCASION_ALIASES.put("party", Set.of("party", "sinh nhat", "birthday", "company party"));
        OCCASION_ALIASES.put("gala", Set.of("da hoi", "gala", "evening", "black tie"));
        OCCASION_ALIASES.put("office", Set.of("cong so", "office", "interview", "business"));
        OCCASION_ALIASES.put("performance", Set.of("bieu dien", "performance", "stage", "dance"));
        OCCASION_ALIASES.put("traditional", Set.of("ao dai", "truyen thong", "traditional"));

        STYLE_ALIASES.put("formal", Set.of("lich su", "formal", "elegant", "sang trong", "trang trong", "tuxedo", "suit", "vest"));
        STYLE_ALIASES.put("casual", Set.of("casual", "thoai mai", "don gian", "tre trung"));
        STYLE_ALIASES.put("traditional", Set.of("truyen thong", "traditional", "ao dai"));
        STYLE_ALIASES.put("fantasy", Set.of("fantasy", "hoa trang", "cosplay"));
        STYLE_ALIASES.put("dramatic", Set.of("noi bat", "dramatic", "statement"));

        COLOR_ALIASES.put("black", Set.of("den", "black"));
        COLOR_ALIASES.put("white", Set.of("trang", "white"));
        COLOR_ALIASES.put("red", Set.of("do", "red"));
        COLOR_ALIASES.put("blue", Set.of("xanh", "blue"));
        COLOR_ALIASES.put("pink", Set.of("hong", "pink"));
        COLOR_ALIASES.put("silver", Set.of("bac", "silver"));
        COLOR_ALIASES.put("gold", Set.of("vang", "gold"));
        COLOR_ALIASES.put("purple", Set.of("tim", "purple"));
        COLOR_ALIASES.put("green", Set.of("xanh la", "green"));
        COLOR_ALIASES.put("brown", Set.of("nau", "brown"));

        GENDER_ALIASES.put("male", Set.of("nam", "male", "men", "boy"));
        GENDER_ALIASES.put("female", Set.of("nu", "nữ", "female", "women", "girl"));
        GENDER_ALIASES.put("unisex", Set.of("unisex"));
    }

    private final AiProviderProperties properties;
    private final AiProviderClient aiProviderClient;
    private final ObjectMapper objectMapper;

    public AiIntentUnderstandingServiceImpl(AiProviderProperties properties,
                                            AiProviderClient aiProviderClient,
                                            ObjectMapper objectMapper) {
        this.properties = properties;
        this.aiProviderClient = aiProviderClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public IntentUnderstandingResult understandIntent(AiChatContext context) {
        if (context == null || context.latestUserMessage() == null || context.latestUserMessage().isBlank()) {
            return buildRuleBasedFallback(AiChatContext.empty(""));
        }

        IntentUnderstandingResult fallback = buildRuleBasedFallback(context);
        if (!properties.isEnabled() || !properties.isProviderConfigured()) {
            return fallback;
        }

        try {
            String rawJson = aiProviderClient.understandIntent(
                    new AiProviderClient.IntentUnderstandingPrompt(context)
            );
            return parseValidatedIntent(rawJson);
        } catch (Exception exception) {
            logger.warn("Falling back to rule-based intent understanding because provider failed: {}", summarize(exception));
            return fallback;
        }
    }

    private IntentUnderstandingResult parseValidatedIntent(String rawJson) throws Exception {
        JsonNode root = objectMapper.readTree(rawJson);
        if (root == null || !root.isObject()) {
            throw new IllegalStateException("AI intent response is not a JSON object.");
        }

        IntentType intent = parseIntentType(root.path("intent").asText(null));
        Language language = parseLanguage(root.path("language").asText(null));
        boolean isFollowUp = parseBooleanNode(root.get("isFollowUp"), intent == IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP);
        boolean refersToPreviousRecommendations = parseBooleanNode(root.get("refersToPreviousRecommendations"), isFollowUp);
        double confidence = parseConfidence(root.get("confidence"));
        BigDecimal budget = parseBudgetNode(root.get("budget"));

        String occasion = normalizeEntity(root.path("occasion").asText(null));
        String style = normalizeEntity(root.path("style").asText(null));
        String color = normalizeEntity(root.path("color").asText(null));
        String gender = normalizeEntity(root.path("gender").asText(null));
        String size = normalizeSize(root.path("size").asText(null));
        String rentalDate = normalizeEntity(root.path("rentalDate").asText(null));
        String productMentioned = normalizeFreeText(root.path("productMentioned").asText(null), 120, false);

        String canonicalJson = serializeIntent(
                intent,
                isFollowUp,
                refersToPreviousRecommendations,
                confidence,
                language,
                occasion,
                style,
                color,
                gender,
                size,
                budget,
                rentalDate,
                productMentioned
        );

        return new IntentUnderstandingResult(
                intent,
                confidence,
                language,
                occasion,
                style,
                color,
                gender,
                size,
                budget,
                rentalDate,
                productMentioned,
                isFollowUp,
                refersToPreviousRecommendations,
                canonicalJson,
                false
        );
    }

    private IntentUnderstandingResult buildRuleBasedFallback(AiChatContext context) {
        String latestUserMessage = context.latestUserMessage();
        String normalizedMessage = normalizeText(latestUserMessage);
        String asciiMessage = normalizeAscii(latestUserMessage);

        Language language = detectLanguage(latestUserMessage, asciiMessage);
        boolean followUp = isRecommendationFollowUp(asciiMessage, context);
        boolean refersToPreviousRecommendations = followUp && refersToPreviousRecommendations(context, asciiMessage);
        IntentType intent = detectIntent(asciiMessage, context, followUp);
        String occasion = detectAliasValue(asciiMessage, OCCASION_ALIASES);
        String style = detectAliasValue(asciiMessage, STYLE_ALIASES);
        String color = detectAliasValue(asciiMessage, COLOR_ALIASES);
        String gender = detectAliasValue(asciiMessage, GENDER_ALIASES);
        String size = extractSize(asciiMessage);
        BigDecimal budget = extractBudget(normalizedMessage);
        String rentalDate = extractRentalDate(asciiMessage);
        String productMentioned = extractProductMention(asciiMessage);
        double confidence = estimateFallbackConfidence(intent, asciiMessage, occasion, style, color, size, budget, rentalDate, followUp);

        String intentJson = serializeIntent(
                intent,
                followUp,
                refersToPreviousRecommendations,
                confidence,
                language,
                occasion,
                style,
                color,
                gender,
                size,
                budget,
                rentalDate,
                productMentioned
        );

        return new IntentUnderstandingResult(
                intent,
                confidence,
                language,
                occasion,
                style,
                color,
                gender,
                size,
                budget,
                rentalDate,
                productMentioned,
                followUp,
                refersToPreviousRecommendations,
                intentJson,
                true
        );
    }

    private IntentType detectIntent(String asciiMessage,
                                    AiChatContext context,
                                    boolean followUp) {
        if (asciiMessage == null || asciiMessage.isBlank()) {
            return IntentType.CASUAL_CHAT;
        }
        if (followUp) {
            return IntentType.RECOMMENDATION_EXPLANATION_FOLLOW_UP;
        }
        if (containsAnyPhrase(asciiMessage, RENTAL_SUPPORT_PHRASES)) {
            return IntentType.RENTAL_SUPPORT;
        }
        if (isProductQuestion(asciiMessage)) {
            return IntentType.PRODUCT_QUESTION;
        }
        if (isRecommendationRequest(asciiMessage, context)) {
            return IntentType.RECOMMENDATION_REQUEST;
        }
        if (containsAnyPhrase(asciiMessage, CASUAL_CHAT_PHRASES)) {
            return IntentType.CASUAL_CHAT;
        }
        return IntentType.OUT_OF_SCOPE;
    }

    private boolean isRecommendationRequest(String asciiMessage, AiChatContext context) {
        return containsAnyPhrase(asciiMessage, RECOMMENDATION_REQUEST_PHRASES)
                || detectAliasValue(asciiMessage, OCCASION_ALIASES) != null
                || detectAliasValue(asciiMessage, STYLE_ALIASES) != null
                || (context != null && "RECOMMENDATION_REQUEST".equalsIgnoreCase(context.lastDetectedIntent()) && containsFollowUpReference(asciiMessage));
    }

    private boolean isRecommendationFollowUp(String asciiMessage, AiChatContext context) {
        if (asciiMessage == null || asciiMessage.isBlank()) {
            return false;
        }

        boolean directFollowUpPhrase = containsAnyPhrase(asciiMessage, FOLLOW_UP_EXPLANATION_PHRASES)
                || containsAnyPhrase(asciiMessage, FOLLOW_UP_COMPARISON_PHRASES);
        boolean conversationSuggestsRecommendations = hasRecommendationContext(context);
        boolean referenceOnlyFollowUp = containsFollowUpReference(asciiMessage)
                && conversationSuggestsRecommendations
                && !containsAnyPhrase(asciiMessage, RENTAL_SUPPORT_PHRASES)
                && !isProductQuestion(asciiMessage);

        return directFollowUpPhrase
                || context != null && context.likelyFollowUp()
                || referenceOnlyFollowUp;
    }

    private boolean hasRecommendationContext(AiChatContext context) {
        if (context == null) {
            return false;
        }
        if (context.hasPreviousRecommendation()) {
            return true;
        }
        if ("RECOMMENDATION_REQUEST".equalsIgnoreCase(context.lastDetectedIntent())
                || "RECOMMENDATION_EXPLANATION_FOLLOW_UP".equalsIgnoreCase(context.lastDetectedIntent())) {
            return true;
        }
        return context.lastUserNeedSummary() != null && !context.lastUserNeedSummary().isBlank();
    }

    private boolean refersToPreviousRecommendations(AiChatContext context, String asciiMessage) {
        return context != null && context.hasPreviousRecommendation() || containsFollowUpReference(asciiMessage);
    }

    private boolean containsFollowUpReference(String asciiMessage) {
        return containsAnyPhrase(asciiMessage, FOLLOW_UP_REFERENCES);
    }

    private boolean isProductQuestion(String asciiMessage) {
        boolean referencesProduct = containsAnyPhrase(asciiMessage, PRODUCT_REFERENCE_PHRASES);
        boolean asksDetail = containsAnyPhrase(asciiMessage, PRODUCT_DETAIL_PHRASES) || extractSize(asciiMessage) != null;
        return (referencesProduct && asksDetail)
                || (asciiMessage.contains("co con hang") && asksDetail)
                || asciiMessage.contains("size ");
    }

    private Language detectLanguage(String latestUserMessage, String asciiMessage) {
        if (latestUserMessage != null && VIETNAMESE_ACCENT_PATTERN.matcher(latestUserMessage).find()) {
            return Language.VI;
        }

        if (asciiMessage == null || asciiMessage.isBlank()) {
            return Language.VI;
        }

        List<String> tokens = List.of(asciiMessage.split("\\s+"));
        int viScore = countLanguageHints(tokens, VI_LANGUAGE_HINTS);
        int enScore = countLanguageHints(tokens, EN_LANGUAGE_HINTS);
        if (enScore >= 2 && enScore > viScore) {
            return Language.EN;
        }
        if (viScore >= 1) {
            return Language.VI;
        }
        if (enScore == 1 && tokens.size() <= 3) {
            return Language.EN;
        }
        return Language.VI;
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

    private String detectAliasValue(String asciiMessage, LinkedHashMap<String, Set<String>> aliasesByValue) {
        if (asciiMessage == null || asciiMessage.isBlank()) {
            return null;
        }

        for (Map.Entry<String, Set<String>> entry : aliasesByValue.entrySet()) {
            for (String alias : entry.getValue()) {
                if (containsPhrase(asciiMessage, alias)) {
                    return entry.getKey();
                }
            }
        }
        return null;
    }

    private String extractSize(String asciiMessage) {
        if (asciiMessage == null || asciiMessage.isBlank()) {
            return null;
        }

        Matcher matcher = SIZE_PATTERN.matcher(asciiMessage);
        return matcher.find() ? matcher.group(1).toUpperCase(Locale.ROOT) : null;
    }

    private BigDecimal extractBudget(String normalizedMessage) {
        if (normalizedMessage == null || normalizedMessage.isBlank()) {
            return null;
        }

        boolean hasBudgetHint = normalizedMessage.contains("ngan sach")
                || normalizedMessage.contains("toi da")
                || normalizedMessage.contains("duoi")
                || normalizedMessage.contains("budget")
                || normalizedMessage.contains("under")
                || normalizedMessage.contains("gia")
                || normalizedMessage.contains("price");

        Matcher matcher = BUDGET_PATTERN.matcher(normalizedMessage);
        while (matcher.find()) {
            String rawNumber = matcher.group(1);
            String rawUnit = matcher.group(2);
            if (rawNumber == null) {
                continue;
            }
            if (rawUnit == null && !hasBudgetHint) {
                continue;
            }

            String sanitizedNumber = rawNumber.replace(".", "").replace(",", ".");
            try {
                BigDecimal numericValue = new BigDecimal(sanitizedNumber);
                String normalizedUnit = rawUnit != null ? rawUnit.toLowerCase(Locale.ROOT) : "";
                if (normalizedUnit.startsWith("tr")) {
                    return numericValue.multiply(BigDecimal.valueOf(1_000_000L));
                }
                if (normalizedUnit.startsWith("k") || normalizedUnit.startsWith("ng")) {
                    return numericValue.multiply(BigDecimal.valueOf(1_000L));
                }
                return numericValue;
            } catch (NumberFormatException ignored) {
                // Keep scanning for the next valid budget expression.
            }
        }

        return null;
    }

    private String extractRentalDate(String asciiMessage) {
        if (asciiMessage == null || asciiMessage.isBlank()) {
            return null;
        }

        Matcher isoMatcher = ISO_DATE_PATTERN.matcher(asciiMessage);
        if (isoMatcher.find()) {
            return isoMatcher.group();
        }
        if (containsPhrase(asciiMessage, "tuan sau") || containsPhrase(asciiMessage, "next week")) {
            return "next_week";
        }
        if (containsPhrase(asciiMessage, "cuoi tuan nay") || containsPhrase(asciiMessage, "this weekend")) {
            return "this_weekend";
        }
        if (containsPhrase(asciiMessage, "ngay mai") || containsPhrase(asciiMessage, "mai") || containsPhrase(asciiMessage, "tomorrow")) {
            return "tomorrow";
        }
        if (containsPhrase(asciiMessage, "hom nay") || containsPhrase(asciiMessage, "today")) {
            return "today";
        }
        return null;
    }

    private String extractProductMention(String asciiMessage) {
        if (asciiMessage == null || asciiMessage.isBlank()) {
            return null;
        }
        if (containsAnyPhrase(asciiMessage, PRODUCT_REFERENCE_PHRASES)) {
            return "current_product";
        }
        return null;
    }

    private double estimateFallbackConfidence(IntentType intent,
                                              String asciiMessage,
                                              String occasion,
                                              String style,
                                              String color,
                                              String size,
                                              BigDecimal budget,
                                              String rentalDate,
                                              boolean followUp) {
        double confidence = switch (intent) {
            case CASUAL_CHAT -> 0.88;
            case RENTAL_SUPPORT -> 0.9;
            case PRODUCT_QUESTION -> 0.86;
            case RECOMMENDATION_REQUEST -> 0.82;
            case RECOMMENDATION_EXPLANATION_FOLLOW_UP -> 0.91;
            case OUT_OF_SCOPE -> 0.5;
        };

        int structureSignals = 0;
        if (occasion != null) {
            structureSignals++;
        }
        if (style != null) {
            structureSignals++;
        }
        if (color != null) {
            structureSignals++;
        }
        if (size != null) {
            structureSignals++;
        }
        if (budget != null) {
            structureSignals++;
        }
        if (rentalDate != null) {
            structureSignals++;
        }
        if (asciiMessage != null && asciiMessage.length() <= 3) {
            confidence -= 0.15;
        }
        if (followUp) {
            confidence += 0.03;
        }

        confidence += Math.min(structureSignals, 3) * 0.03;
        return Math.max(0.0, Math.min(0.99, confidence));
    }

    private String serializeIntent(IntentType intent,
                                   boolean isFollowUp,
                                   boolean refersToPreviousRecommendations,
                                   double confidence,
                                   Language language,
                                   String occasion,
                                   String style,
                                   String color,
                                   String gender,
                                   String size,
                                   BigDecimal budget,
                                   String rentalDate,
                                   String productMentioned) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("intent", intent.name());
            payload.put("isFollowUp", isFollowUp);
            payload.put("refersToPreviousRecommendations", refersToPreviousRecommendations);
            payload.put("confidence", confidence);
            payload.put("language", language.providerCode());
            payload.put("occasion", occasion);
            payload.put("style", style);
            payload.put("color", color);
            payload.put("gender", gender);
            payload.put("size", size);
            payload.put("budget", budget);
            payload.put("rentalDate", rentalDate);
            payload.put("productMentioned", productMentioned);
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot serialize intent JSON.", exception);
        }
    }

    private IntentType parseIntentType(String rawValue) {
        try {
            return IntentType.valueOf(normalizeEnum(rawValue));
        } catch (Exception exception) {
            throw new IllegalStateException("Unsupported AI intent value.");
        }
    }

    private Language parseLanguage(String rawValue) {
        String normalized = normalizeEntity(rawValue);
        if ("vi".equals(normalized)) {
            return Language.VI;
        }
        if ("en".equals(normalized)) {
            return Language.EN;
        }
        throw new IllegalStateException("Unsupported AI language value.");
    }

    private boolean parseBooleanNode(JsonNode node, boolean defaultValue) {
        if (node == null || node.isNull()) {
            return defaultValue;
        }
        if (node.isBoolean()) {
            return node.asBoolean();
        }
        String text = node.asText(null);
        if ("true".equalsIgnoreCase(text)) {
            return true;
        }
        if ("false".equalsIgnoreCase(text)) {
            return false;
        }
        throw new IllegalStateException("AI follow-up flag must be boolean.");
    }

    private double parseConfidence(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            throw new IllegalStateException("AI confidence must be numeric.");
        }

        double confidence = node.asDouble();
        if (confidence < 0.0 || confidence > 1.0) {
            throw new IllegalStateException("AI confidence must be between 0 and 1.");
        }
        return confidence;
    }

    private BigDecimal parseBudgetNode(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.decimalValue().signum() < 0 ? null : node.decimalValue();
        }

        try {
            BigDecimal parsed = new BigDecimal(node.asText().trim());
            return parsed.signum() < 0 ? null : parsed;
        } catch (Exception exception) {
            throw new IllegalStateException("AI budget value is invalid.");
        }
    }

    private String normalizeEnum(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.toUpperCase(Locale.ROOT);
    }

    private String normalizeEntity(String value) {
        return normalizeFreeText(value, 80, true);
    }

    private String normalizeSize(String value) {
        String normalized = normalizeFreeText(value, 16, false);
        return normalized == null ? null : normalized.toUpperCase(Locale.ROOT);
    }

    private String normalizeFreeText(String value, int maxLength, boolean lowerCase) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed)) {
            return null;
        }

        if (trimmed.length() > maxLength) {
            trimmed = trimmed.substring(0, maxLength).trim();
        }
        return lowerCase ? trimmed.toLowerCase(Locale.ROOT) : trimmed;
    }

    private boolean containsAnyPhrase(String text, Set<String> phrases) {
        for (String phrase : phrases) {
            if (containsPhrase(text, phrase)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsPhrase(String text, String phrase) {
        if (text == null || text.isBlank() || phrase == null || phrase.isBlank()) {
            return false;
        }
        Pattern pattern = Pattern.compile("(^|[^\\p{L}\\p{N}])" + Pattern.quote(phrase) + "([^\\p{L}\\p{N}]|$)");
        return pattern.matcher(text).find();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = NORMALIZE_TEXT_PATTERN.matcher(value.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
        return normalized.isEmpty() ? null : normalized.replaceAll("\\s+", " ");
    }

    private String normalizeAscii(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }

        String stripped = Normalizer.normalize(normalized, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
        return stripped.isBlank() ? null : stripped;
    }

    private String summarize(Exception exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? exception.getClass().getSimpleName() : message;
    }
}
