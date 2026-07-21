package com.aurafit.dto.response;

import com.aurafit.entity.ProductAiMetadata;

import java.time.LocalDateTime;
import java.util.List;

public record ProductAiMetadataResponse(
        Long id,
        Long costumeId,
        List<String> colorTags,
        List<String> fitTags,
        List<String> genderTags,
        List<String> materialTags,
        List<String> occasionTags,
        List<String> seasonTags,
        List<String> sizeTags,
        List<String> styleTags,
        List<String> trendTags,
        String adminNotes,
        String budgetTier,
        String createdByEmail,
        String formalityLevel,
        String searchableText,
        String silhouette,
        String updatedByEmail,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ProductAiMetadataResponse fromEntity(ProductAiMetadata metadata) {
        if (metadata == null) {
            return null;
        }
        return new ProductAiMetadataResponse(
                metadata.getId(),
                metadata.getCostumeId(),
                safeTags(metadata.getColorTags()),
                safeTags(metadata.getFitTags()),
                safeTags(metadata.getGenderTags()),
                safeTags(metadata.getMaterialTags()),
                safeTags(metadata.getOccasionTags()),
                safeTags(metadata.getSeasonTags()),
                safeTags(metadata.getSizeTags()),
                safeTags(metadata.getStyleTags()),
                safeTags(metadata.getTrendTags()),
                metadata.getAdminNotes(),
                metadata.getBudgetTier(),
                metadata.getCreatedByEmail(),
                metadata.getFormalityLevel(),
                metadata.getSearchableText(),
                metadata.getSilhouette(),
                metadata.getUpdatedByEmail(),
                metadata.getCreatedAt(),
                metadata.getUpdatedAt()
        );
    }

    private static List<String> safeTags(List<String> tags) {
        return tags == null ? List.of() : List.copyOf(tags);
    }
}
