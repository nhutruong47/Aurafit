package com.aurafit.config;

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
}
