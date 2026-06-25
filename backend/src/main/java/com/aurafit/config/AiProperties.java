package com.aurafit.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private boolean enabled = true;
    private String providerBaseUrl = "https://api.openai.com/v1";
    private String apiKey;
    private String embeddingModel = "text-embedding-3-small";
    private String chatModel = "gpt-4.1-mini";
    private int fallbackEmbeddingDimension = 64;
    private int defaultRecommendationLimit = 6;
    private int candidatePoolSize = 24;
    private int profileTopTagLimit = 5;
    private long profileStaleMinutes = 60;
    private boolean llmExplanationEnabled = true;
}
