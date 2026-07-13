package com.aurafit.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai")
public class AiProviderProperties {

    private boolean enabled;
    private String providerBaseUrl = "";
    private String providerApiKey = "";
    // TODO: reserved for LLM reasoning phase - not yet wired to runtime logic.
    private String embeddingModel = "";
    private String chatModel = "";
    // TODO: reserved for LLM reasoning phase - not yet wired to runtime logic.
    private int fallbackEmbeddingDimension = 64;
    // TODO: reserved for LLM reasoning phase - not yet wired to runtime logic.
    private int defaultRecommendationLimit = 6;
    // TODO: reserved for LLM reasoning phase - not yet wired to runtime logic.
    private int candidatePoolSize = 24;
    // TODO: reserved for LLM reasoning phase - not yet wired to runtime logic.
    private int profileTopTagLimit = 5;
    // TODO: reserved for LLM reasoning phase - not yet wired to runtime logic.
    private int profileStaleMinutes = 60;
    private boolean reasoningRankingEnabled;
    private boolean similarProductsReasoningEnabled;
    private boolean homepageReasoningEnabled;
    private boolean llmExplanationEnabled;
    private int providerConnectTimeoutMillis = 2000;
    private int providerReadTimeoutMillis = 6000;
    private int providerMaxRetries = 1;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProviderBaseUrl() {
        return providerBaseUrl;
    }

    public void setProviderBaseUrl(String providerBaseUrl) {
        this.providerBaseUrl = providerBaseUrl;
    }

    public String getProviderApiKey() {
        return providerApiKey;
    }

    public void setProviderApiKey(String providerApiKey) {
        this.providerApiKey = providerApiKey;
    }

    public String getEmbeddingModel() {
        return embeddingModel;
    }

    public void setEmbeddingModel(String embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public String getChatModel() {
        return chatModel;
    }

    public void setChatModel(String chatModel) {
        this.chatModel = chatModel;
    }

    public int getFallbackEmbeddingDimension() {
        return fallbackEmbeddingDimension;
    }

    public void setFallbackEmbeddingDimension(int fallbackEmbeddingDimension) {
        this.fallbackEmbeddingDimension = fallbackEmbeddingDimension;
    }

    public int getDefaultRecommendationLimit() {
        return defaultRecommendationLimit;
    }

    public void setDefaultRecommendationLimit(int defaultRecommendationLimit) {
        this.defaultRecommendationLimit = defaultRecommendationLimit;
    }

    public int getCandidatePoolSize() {
        return candidatePoolSize;
    }

    public void setCandidatePoolSize(int candidatePoolSize) {
        this.candidatePoolSize = candidatePoolSize;
    }

    public int getProfileTopTagLimit() {
        return profileTopTagLimit;
    }

    public void setProfileTopTagLimit(int profileTopTagLimit) {
        this.profileTopTagLimit = profileTopTagLimit;
    }

    public int getProfileStaleMinutes() {
        return profileStaleMinutes;
    }

    public void setProfileStaleMinutes(int profileStaleMinutes) {
        this.profileStaleMinutes = profileStaleMinutes;
    }

    public boolean isReasoningRankingEnabled() {
        return reasoningRankingEnabled;
    }

    public void setReasoningRankingEnabled(boolean reasoningRankingEnabled) {
        this.reasoningRankingEnabled = reasoningRankingEnabled;
    }

    public boolean isLlmExplanationEnabled() {
        return llmExplanationEnabled;
    }

    public void setLlmExplanationEnabled(boolean llmExplanationEnabled) {
        this.llmExplanationEnabled = llmExplanationEnabled;
    }

    public boolean isSimilarProductsReasoningEnabled() {
        return similarProductsReasoningEnabled;
    }

    public void setSimilarProductsReasoningEnabled(boolean similarProductsReasoningEnabled) {
        this.similarProductsReasoningEnabled = similarProductsReasoningEnabled;
    }

    public boolean isHomepageReasoningEnabled() {
        return homepageReasoningEnabled;
    }

    public void setHomepageReasoningEnabled(boolean homepageReasoningEnabled) {
        this.homepageReasoningEnabled = homepageReasoningEnabled;
    }

    public int getProviderConnectTimeoutMillis() {
        return providerConnectTimeoutMillis;
    }

    public void setProviderConnectTimeoutMillis(int providerConnectTimeoutMillis) {
        this.providerConnectTimeoutMillis = providerConnectTimeoutMillis;
    }

    public int getProviderReadTimeoutMillis() {
        return providerReadTimeoutMillis;
    }

    public void setProviderReadTimeoutMillis(int providerReadTimeoutMillis) {
        this.providerReadTimeoutMillis = providerReadTimeoutMillis;
    }

    public int getProviderMaxRetries() {
        return providerMaxRetries;
    }

    public void setProviderMaxRetries(int providerMaxRetries) {
        this.providerMaxRetries = providerMaxRetries;
    }

    public boolean isProviderConfigured() {
        return hasText(providerBaseUrl) && hasText(providerApiKey) && hasText(chatModel);
    }

    public boolean isExplanationAvailable() {
        return enabled && llmExplanationEnabled && isProviderConfigured();
    }

    public boolean isReasoningRankingAvailable() {
        return enabled && reasoningRankingEnabled && isProviderConfigured();
    }

    public boolean isSimilarProductsReasoningAvailable() {
        return enabled && similarProductsReasoningEnabled && isProviderConfigured();
    }

    public boolean isHomepageReasoningAvailable() {
        return enabled && homepageReasoningEnabled && isProviderConfigured();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
