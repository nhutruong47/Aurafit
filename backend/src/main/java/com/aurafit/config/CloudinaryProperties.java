package com.aurafit.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "cloudinary")
public record CloudinaryProperties(
        @NotBlank(message = "CLOUDINARY_CLOUD_NAME is required")
        String cloudName,
        @NotBlank(message = "CLOUDINARY_API_KEY is required")
        String apiKey,
        @NotBlank(message = "CLOUDINARY_API_SECRET is required")
        String apiSecret
) {
}
