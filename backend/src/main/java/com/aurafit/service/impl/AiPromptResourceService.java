package com.aurafit.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiPromptResourceService {

    private static final Logger logger = LoggerFactory.getLogger(AiPromptResourceService.class);

    private final Map<String, String> promptCache = new ConcurrentHashMap<>();

    public String loadPromptContent(String classpathLocation, String fallbackContent) {
        return promptCache.computeIfAbsent(classpathLocation, key -> readPromptContent(key, fallbackContent));
    }

    private String readPromptContent(String classpathLocation, String fallbackContent) {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        if (!resource.exists()) {
            logger.warn("AI prompt resource {} was not found. Falling back to default prompt content.", classpathLocation);
            return fallbackContent;
        }

        try (var inputStream = resource.getInputStream()) {
            String content = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8).trim();
            if (content.isBlank()) {
                logger.warn("AI prompt resource {} is empty. Falling back to default prompt content.", classpathLocation);
                return fallbackContent;
            }
            return content;
        } catch (IOException exception) {
            logger.warn("Cannot read AI prompt resource {}. Falling back to default prompt content. Cause: {}",
                    classpathLocation, exception.getMessage());
            return fallbackContent;
        }
    }
}
