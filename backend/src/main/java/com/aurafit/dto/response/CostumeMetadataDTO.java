package com.aurafit.dto.response;

import com.aurafit.entity.CostumeMetadata;

import java.util.List;

public record CostumeMetadataDTO(
        String style,
        String occasion,
        String season,
        String color,
        List<String> tags,
        String skinTone,
        String bodyType,
        String gender,
        String size,
        String material,
        String fitNote
) {
    public static CostumeMetadataDTO fromEntity(CostumeMetadata metadata) {
        if (metadata == null) {
            return null;
        }

        return new CostumeMetadataDTO(
                metadata.getStyle(),
                metadata.getOccasion(),
                metadata.getSeason(),
                metadata.getColor(),
                List.copyOf(metadata.getTags()),
                metadata.getSkinTone(),
                metadata.getBodyType(),
                metadata.getGender(),
                metadata.getSize(),
                metadata.getMaterial(),
                metadata.getFitNote()
        );
    }
}
