package com.aurafit.ai.tryon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TryOnResponse {

    private Long id;
    private Long userId;
    private Long productId;
    private String productName;
    private String originalImageUrl;
    private String generatedImageUrl;
    private String status;
    private String errorMessage;
    private LocalDateTime createdAt;
}
