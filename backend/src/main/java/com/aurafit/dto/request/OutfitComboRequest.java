package com.aurafit.dto.request;

import java.util.List;

public record OutfitComboRequest(
        Long anchorCostumeId,
        String prompt,
        List<String> occasionTags,
        List<String> colorTags,
        Integer limit
) {}
