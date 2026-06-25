package com.aurafit.dto.response;

import com.aurafit.enums.FashionTrendSourceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FashionTrendResponse(
        Long id,
        String trendName,
        String seasonLabel,
        List<String> styleTags,
        List<String> colorTags,
        List<String> occasionTags,
        List<String> audienceTags,
        BigDecimal boostScore,
        FashionTrendSourceType sourceType,
        String sourceNote,
        String summaryText,
        LocalDateTime activeFrom,
        LocalDateTime activeTo
) {}
