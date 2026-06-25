package com.aurafit.dto.response;

import java.util.List;

public record OutfitComboResponse(
        String anchorLabel,
        boolean fallbackUsed,
        List<RecommendationItemResponse> items
) {}
