package com.aurafit.ai.stylist.service;

import java.math.BigDecimal;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StylistFilterCriteria(
        String category,
        String requestedItem,
        String style,
        String occasion,
        String season,
        String color,
        String gender,
        List<String> tags,
        BigDecimal minBudget,
        BigDecimal maxBudget
) {
    public StylistFilterCriteria(
            String category,
            String style,
            String occasion,
            String season,
            String color,
            String gender,
            List<String> tags,
            BigDecimal minBudget,
            BigDecimal maxBudget
    ) {
        this(
                category,
                null,
                style,
                occasion,
                season,
                color,
                gender,
                tags,
                minBudget,
                maxBudget
        );
    }

    public static StylistFilterCriteria empty() {
        return new StylistFilterCriteria(null, null, null, null, null, null, null, null, null, null);
    }
}
