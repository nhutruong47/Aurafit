package com.aurafit.config;

import com.aurafit.service.UserPreferenceSummaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CacheEvictionTask {

    private static final Logger log = LoggerFactory.getLogger(CacheEvictionTask.class);

    // Evict all entries in "homepage_recommendations" cache every 15 minutes
    @Scheduled(fixedRate = 900000)
    @CacheEvict(value = "homepage_recommendations", allEntries = true)
    public void evictHomepageRecommendationsCache() {
        log.info("Evicted homepage_recommendations cache");
    }

    // Keep the chat-facing preference summary fresher than homepage recommendations.
    @Scheduled(fixedRate = 300000)
    @CacheEvict(value = UserPreferenceSummaryService.CACHE_NAME, allEntries = true)
    public void evictUserPreferenceSummaryCache() {
        log.info("Evicted {} cache", UserPreferenceSummaryService.CACHE_NAME);
    }

    // Similar-products reasoning can be cached longer because catalog changes less frequently than chat/session state.
    @Scheduled(fixedRate = 14400000)
    @CacheEvict(value = "similar_recommendations_reasoning", allEntries = true)
    public void evictSimilarRecommendationReasoningCache() {
        log.info("Evicted similar_recommendations_reasoning cache");
    }
}
