package com.aurafit.dto.response;

import com.aurafit.entity.AiStylistMessage;
import com.aurafit.enums.AiStylistMessageRole;

import java.util.List;

public record AiStylistMessageDTO(
        Long id,
        AiStylistMessageRole role,
        String content,
        List<SimilarCostumeRecommendationDTO> recommendations,
        Boolean fallback,
        String createdAt
) {
    public static AiStylistMessageDTO fromEntity(
            AiStylistMessage message,
            List<SimilarCostumeRecommendationDTO> recommendations,
            Boolean fallback
    ) {
        return new AiStylistMessageDTO(
                message.getId(),
                message.getRole(),
                message.getContent(),
                recommendations,
                fallback,
                message.getCreatedAt() != null ? message.getCreatedAt().toString() : null
        );
    }
}
