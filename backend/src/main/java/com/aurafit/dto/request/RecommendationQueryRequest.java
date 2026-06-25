package com.aurafit.dto.request;

import java.math.BigDecimal;
import java.util.List;

public record RecommendationQueryRequest(
        String prompt,
        List<String> styleTags,
        List<String> occasionTags,
        List<String> colorTags,
        List<String> sizeTags,
        List<String> genderTags,
        List<String> seasonTags,
        BigDecimal budgetMin,
        BigDecimal budgetMax,
        Integer limit
) {}
