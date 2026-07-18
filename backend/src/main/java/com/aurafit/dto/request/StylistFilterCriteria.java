package com.aurafit.dto.request;

import java.math.BigDecimal;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StylistFilterCriteria(
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
    public static StylistFilterCriteria empty() {
        return new StylistFilterCriteria(null, null, null, null, null, null, null, null, null);
    }
}
