package com.aurafit.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.aurafit.service.AiIntentUnderstandingService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record RecommendationReasoningInput(
        String userMessage,
        AiIntentUnderstandingService.IntentUnderstandingResult parsedIntent,
        List<CandidateCostume> candidatePool,
        String userPreferenceSummary,
        RentalDateRange rentalDateRange
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CandidateCostume(
            String id,
            String name,
            String description,
            BigDecimal rentalPrice,
            BigDecimal depositPrice,
            String style,
            String occasion,
            String season,
            String color,
            String category,
            List<String> tags,
            String skinTone,
            String bodyType,
            String material,
            String fitNote,
            String sizeLabel,
            Integer availableItemCount
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RentalDateRange(
            LocalDate startDate,
            LocalDate endDate
    ) {
    }
}
