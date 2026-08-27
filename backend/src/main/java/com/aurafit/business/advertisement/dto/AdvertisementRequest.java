package com.aurafit.business.advertisement.dto;

import com.aurafit.business.advertisement.entity.AdPosition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdvertisementRequest {
    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String targetUrl;

    @NotNull(message = "Position is required")
    private AdPosition position;

    private Boolean isActive = true;
    
    private Integer displayOrder = 0;
}
