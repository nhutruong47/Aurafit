package com.aurafit.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record RecommendationReasoningOutput(
        List<RecommendationItem> recommendations,
        String clarificationNeeded,
        String noMatchReason
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RecommendationItem(
            String costumeId,
            String reasoning,
            double confidenceScore,
            List<String> matchedAttributes
    ) {
    }
}
