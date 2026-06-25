package com.aurafit.dto.response;

public record RecommendationItemResponse(
        CostumeDTO costume,
        String reason,
        double score,
        String source
) {}
