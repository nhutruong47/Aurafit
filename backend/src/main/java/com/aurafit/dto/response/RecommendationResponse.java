package com.aurafit.dto.response;

import java.util.List;

public record RecommendationResponse(
        String queryText,
        String profileSummary,
        boolean fallbackUsed,
        List<RecommendationItemResponse> items
) {}
