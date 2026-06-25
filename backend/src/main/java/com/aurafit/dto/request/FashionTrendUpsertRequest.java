package com.aurafit.dto.request;

import com.aurafit.enums.FashionTrendSourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FashionTrendUpsertRequest(
        @NotBlank(message = "Trend name is required")
        String trendName,
        String seasonLabel,
        List<String> styleTags,
        List<String> colorTags,
        List<String> occasionTags,
        List<String> audienceTags,
        @NotNull(message = "Boost score is required")
        BigDecimal boostScore,
        FashionTrendSourceType sourceType,
        String sourceNote,
        String summaryText,
        LocalDateTime activeFrom,
        LocalDateTime activeTo
) {}
