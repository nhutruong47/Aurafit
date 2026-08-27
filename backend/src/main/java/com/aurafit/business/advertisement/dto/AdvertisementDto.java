package com.aurafit.business.advertisement.dto;

import com.aurafit.business.advertisement.entity.AdPosition;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AdvertisementDto {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private String targetUrl;
    private AdPosition position;
    private Boolean isActive;
    private Integer displayOrder;
    private LocalDateTime createdAt;
}
