package com.aurafit.service.impl;

import com.aurafit.dto.request.TrackInteractionRequest;
import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.UserPreferenceSummaryService;
import com.aurafit.service.UserInteractionService;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@Transactional
public class UserInteractionServiceImpl implements UserInteractionService {

    private final UserInteractionEventRepository userInteractionEventRepository;
    private final UserRepository userRepository;
    private final CacheManager cacheManager;

    public UserInteractionServiceImpl(UserInteractionEventRepository userInteractionEventRepository,
                                      UserRepository userRepository,
                                      CacheManager cacheManager) {
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.userRepository = userRepository;
        this.cacheManager = cacheManager;
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void track(TrackInteractionRequest request, String authenticatedEmail) {
        UserInteractionEvent event = UserInteractionEvent.builder()
                .user(resolveAuthenticatedUser(authenticatedEmail))
                .sessionId(request.sessionId().trim())
                .eventType(request.eventType())
                .targetType(request.targetType())
                .targetId(normalizeNullable(request.targetId()))
                .queryText(normalizeNullable(request.queryText()))
                .pagePath(normalizeNullable(request.pagePath()))
                .metadataJson(normalizeNullable(request.metadataJson()))
                .build();

        userInteractionEventRepository.save(event);
        if (shouldInvalidatePreferenceSummary(event.getEventType())) {
            schedulePreferenceSummaryEviction(
                    event.getUser() != null && event.getUser().getId() != null ? String.valueOf(event.getUser().getId()) : null,
                    event.getSessionId()
            );
        }
    }

    @Override
    public int attachSessionToUser(String sessionId, String authenticatedEmail) {
        User user = resolveAuthenticatedUser(authenticatedEmail);
        if (user == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        String normalizedSessionId = sessionId.trim();
        int updatedCount = userInteractionEventRepository.attachSessionToUser(normalizedSessionId, user);
        schedulePreferenceSummaryEviction(null, normalizedSessionId);
        schedulePreferenceSummaryEviction(user.getId() != null ? String.valueOf(user.getId()) : null, normalizedSessionId);
        return updatedCount;
    }

    private boolean shouldInvalidatePreferenceSummary(com.aurafit.enums.InteractionEventType eventType) {
        return switch (eventType) {
            case VIEW_PRODUCT, SEARCH, ADD_TO_CART, RENT, CHAT_QUERY, RECOMMENDATION_CLICK, WISHLIST_ADD -> true;
            default -> false;
        };
    }

    private void schedulePreferenceSummaryEviction(String userId, String sessionId) {
        String normalizedUserId = normalizeNullable(userId);
        String normalizedSessionId = normalizeNullable(sessionId);
        if (normalizedUserId == null && normalizedSessionId == null) {
            return;
        }

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evictPreferenceSummary(normalizedUserId, normalizedSessionId);
                }
            });
            return;
        }

        evictPreferenceSummary(normalizedUserId, normalizedSessionId);
    }

    private void evictPreferenceSummary(String userId, String sessionId) {
        Cache cache = cacheManager != null ? cacheManager.getCache(UserPreferenceSummaryService.CACHE_NAME) : null;
        if (cache == null) {
            return;
        }

        cache.evictIfPresent(buildCacheKey(userId, sessionId));
    }

    private User resolveAuthenticatedUser(String authenticatedEmail) {
        if (authenticatedEmail == null || authenticatedEmail.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authenticatedEmail));
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildCacheKey(String userId, String sessionId) {
        return (userId == null ? "" : userId) + "::" + (sessionId == null ? "" : sessionId);
    }
}
