package com.aurafit.service.impl;

import com.aurafit.config.AiProviderProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

@Service
public class RecommendationReasoningGuardrailService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationReasoningGuardrailService.class);
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(1);

    private final AiProviderProperties properties;
    private final Clock clock;

    private final Map<String, Deque<Instant>> requestsByActor = new HashMap<>();
    private final Deque<AttemptRecord> recentAttempts = new ArrayDeque<>();

    private long totalRequests;
    private long totalFallbacks;
    private long timeoutFallbacks;
    private long parseErrorFallbacks;
    private long rateLimitFallbacks;
    private long circuitOpenFallbacks;
    private long otherFallbacks;
    private long clarificationResponses;
    private long noMatchResponses;

    private Instant circuitOpenUntil;

    @Autowired
    public RecommendationReasoningGuardrailService(AiProviderProperties properties) {
        this(properties, Clock.systemUTC());
    }

    RecommendationReasoningGuardrailService(AiProviderProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock == null ? Clock.systemUTC() : clock;
    }

    public synchronized GuardrailDecision beforeRequest(String actorKey) {
        Instant now = clock.instant();
        totalRequests++;
        refreshCircuitState(now);
        purgeRecentAttempts(now);

        if (isCircuitOpen(now)) {
            totalFallbacks++;
            circuitOpenFallbacks++;
            logger.warn(
                    "Recommendation reasoning blocked by guardrail: reason={}, actorKey={}, circuitOpenUntil={}, recentAttemptCount={}, recentFailureCount={}",
                    FallbackReason.CIRCUIT_OPEN,
                    normalizeActorKey(actorKey),
                    circuitOpenUntil,
                    recentAttempts.size(),
                    countRecentFailures()
            );
            return new GuardrailDecision(false, FallbackReason.CIRCUIT_OPEN, "Reasoning circuit breaker is open.");
        }

        if (isRateLimited(normalizeActorKey(actorKey), now)) {
            totalFallbacks++;
            rateLimitFallbacks++;
            logger.warn(
                    "Recommendation reasoning blocked by guardrail: reason={}, actorKey={}, limitPerMinute={}, recentAttemptCount={}, recentFailureCount={}",
                    FallbackReason.RATE_LIMIT,
                    normalizeActorKey(actorKey),
                    Math.max(1, properties.getReasoningRateLimitPerMinute()),
                    recentAttempts.size(),
                    countRecentFailures()
            );
            return new GuardrailDecision(false, FallbackReason.RATE_LIMIT, "Reasoning rate limit exceeded for actor.");
        }

        return new GuardrailDecision(true, null, null);
    }

    public synchronized void recordSuccess() {
        recordAttempt(true, clock.instant());
    }

    public synchronized void recordClarification() {
        clarificationResponses++;
        recordAttempt(true, clock.instant());
    }

    public synchronized void recordNoMatch() {
        noMatchResponses++;
        recordAttempt(true, clock.instant());
    }

    public synchronized void recordFailure(FallbackReason fallbackReason) {
        if (fallbackReason == null) {
            fallbackReason = FallbackReason.OTHER;
        }

        totalFallbacks++;
        switch (fallbackReason) {
            case TIMEOUT -> timeoutFallbacks++;
            case PARSE_ERROR -> parseErrorFallbacks++;
            case RATE_LIMIT -> rateLimitFallbacks++;
            case CIRCUIT_OPEN -> circuitOpenFallbacks++;
            case OTHER -> otherFallbacks++;
        }

        if (fallbackReason == FallbackReason.TIMEOUT
                || fallbackReason == FallbackReason.PARSE_ERROR
                || fallbackReason == FallbackReason.OTHER) {
            recordAttempt(false, clock.instant());
        }
    }

    public synchronized RuntimeSnapshot snapshot() {
        Instant now = clock.instant();
        refreshCircuitState(now);
        purgeRecentAttempts(now);

        int recentAttemptCount = recentAttempts.size();
        int recentFailureCount = 0;
        for (AttemptRecord attempt : recentAttempts) {
            if (!attempt.success()) {
                recentFailureCount++;
            }
        }

        return new RuntimeSnapshot(
                totalRequests,
                totalFallbacks,
                timeoutFallbacks,
                parseErrorFallbacks,
                rateLimitFallbacks,
                circuitOpenFallbacks,
                otherFallbacks,
                clarificationResponses,
                noMatchResponses,
                isCircuitOpen(now),
                circuitOpenUntil,
                recentAttemptCount,
                recentFailureCount,
                recentAttemptCount == 0 ? 0D : (recentFailureCount * 100.0D) / recentAttemptCount
        );
    }

    private boolean isRateLimited(String actorKey, Instant now) {
        int limitPerMinute = Math.max(1, properties.getReasoningRateLimitPerMinute());
        Deque<Instant> timestamps = requestsByActor.computeIfAbsent(actorKey, ignored -> new ArrayDeque<>());
        purgeActorWindow(timestamps, now);
        if (timestamps.size() >= limitPerMinute) {
            return true;
        }

        timestamps.addLast(now);
        return false;
    }

    private void purgeActorWindow(Deque<Instant> timestamps, Instant now) {
        Instant cutoff = now.minus(RATE_LIMIT_WINDOW);
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
            timestamps.removeFirst();
        }
    }

    private void recordAttempt(boolean success, Instant now) {
        recentAttempts.addLast(new AttemptRecord(now, success));
        purgeRecentAttempts(now);
        evaluateCircuit(now);
    }

    private void purgeRecentAttempts(Instant now) {
        Duration window = Duration.ofMinutes(Math.max(1, properties.getReasoningCircuitWindowMinutes()));
        Instant cutoff = now.minus(window);
        while (!recentAttempts.isEmpty() && recentAttempts.peekFirst().timestamp().isBefore(cutoff)) {
            recentAttempts.removeFirst();
        }
    }

    private int countRecentFailures() {
        int recentFailureCount = 0;
        for (AttemptRecord attempt : recentAttempts) {
            if (!attempt.success()) {
                recentFailureCount++;
            }
        }
        return recentFailureCount;
    }

    private void evaluateCircuit(Instant now) {
        if (isCircuitOpen(now)) {
            return;
        }

        int attemptCount = recentAttempts.size();
        int minimumCalls = Math.max(1, properties.getReasoningCircuitMinimumCalls());
        if (attemptCount < minimumCalls) {
            return;
        }

        int failureCount = 0;
        for (AttemptRecord attempt : recentAttempts) {
            if (!attempt.success()) {
                failureCount++;
            }
        }

        double failureRatePercent = (failureCount * 100.0D) / attemptCount;
        if (failureRatePercent >= properties.getReasoningCircuitFailureThresholdPercent()) {
            circuitOpenUntil = now.plus(Duration.ofMinutes(Math.max(1, properties.getReasoningCircuitCooldownMinutes())));
            logger.warn(
                    "Recommendation reasoning circuit breaker opened until {} after {} failures out of {} attempts in the last {} minute(s). " +
                            "This implementation is in-memory and is not shared across multiple backend instances.",
                    circuitOpenUntil,
                    failureCount,
                    attemptCount,
                    properties.getReasoningCircuitWindowMinutes()
            );
        }
    }

    private void refreshCircuitState(Instant now) {
        if (circuitOpenUntil != null && !now.isBefore(circuitOpenUntil)) {
            logger.info("Recommendation reasoning circuit breaker closed. Traffic can try LLM reasoning again.");
            circuitOpenUntil = null;
        }
    }

    private boolean isCircuitOpen(Instant now) {
        return circuitOpenUntil != null && now.isBefore(circuitOpenUntil);
    }

    private String normalizeActorKey(String actorKey) {
        if (actorKey == null || actorKey.isBlank()) {
            return "anonymous";
        }
        return actorKey.trim();
    }

    public enum FallbackReason {
        TIMEOUT,
        PARSE_ERROR,
        RATE_LIMIT,
        CIRCUIT_OPEN,
        OTHER
    }

    public record GuardrailDecision(
            boolean allowed,
            FallbackReason fallbackReason,
            String message
    ) {
    }

    public record RuntimeSnapshot(
            long totalRequests,
            long totalFallbacks,
            long timeoutFallbacks,
            long parseErrorFallbacks,
            long rateLimitFallbacks,
            long circuitOpenFallbacks,
            long otherFallbacks,
            long clarificationResponses,
            long noMatchResponses,
            boolean circuitOpen,
            Instant circuitOpenUntil,
            int recentAttemptCount,
            int recentFailureCount,
            double recentFailureRatePercent
    ) {
    }

    private record AttemptRecord(
            Instant timestamp,
            boolean success
    ) {
    }
}
