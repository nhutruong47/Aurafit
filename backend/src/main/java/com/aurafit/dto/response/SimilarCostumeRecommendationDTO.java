package com.aurafit.dto.response;

import com.aurafit.entity.Costume;

public record   SimilarCostumeRecommendationDTO(
        CostumeDTO costume,
        String reason,
        int score,
        int availableItemCount
) {
    public static SimilarCostumeRecommendationDTO fromEntity(
            Costume costume,
            String reason,
            int score,
            int availableItemCount
    ) {
        return new SimilarCostumeRecommendationDTO(
                CostumeDTO.fromEntity(costume),
                reason,
                score,
                availableItemCount
        );
    }
}
