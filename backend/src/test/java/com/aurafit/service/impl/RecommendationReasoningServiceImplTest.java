package com.aurafit.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.config.AiProviderProperties;
import com.aurafit.dto.ai.RecommendationReasoningInput;
import com.aurafit.dto.ai.RecommendationReasoningOutput;
import com.aurafit.exception.AiReasoningGuardrailException;
import com.aurafit.service.AiProviderClient;
import com.aurafit.service.RecommendationReasoningService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationReasoningServiceImplTest {

    @Mock
    private AiProviderClient aiProviderClient;

    @Test
    void reason_ShouldRateLimitPerActorAndAvoidSecondProviderCall() {
        AiProviderProperties properties = baseProperties();
        properties.setReasoningRateLimitPerMinute(1);
        MutableClock clock = new MutableClock(Instant.parse("2026-07-13T03:00:00Z"));
        RecommendationReasoningServiceImpl service = new RecommendationReasoningServiceImpl(
                properties,
                aiProviderClient,
                new ObjectMapper(),
                new RecommendationReasoningGuardrailService(properties, clock)
        );

        when(aiProviderClient.reasonRecommendations(any())).thenReturn(validRecommendationJson());

        RecommendationReasoningOutput first = service.reason(
                sampleInput(),
                RecommendationReasoningService.RecommendationReasoningMode.AI_STYLIST_CHAT,
                "guest:test-001"
        );
        AiReasoningGuardrailException secondError = assertThrows(
                AiReasoningGuardrailException.class,
                () -> service.reason(
                        sampleInput(),
                        RecommendationReasoningService.RecommendationReasoningMode.AI_STYLIST_CHAT,
                        "guest:test-001"
                )
        );

        assertEquals("2", first.recommendations().get(0).costumeId());
        assertEquals(RecommendationReasoningGuardrailService.FallbackReason.RATE_LIMIT, secondError.getFallbackReason());
        verify(aiProviderClient, times(1)).reasonRecommendations(any());
    }

    @Test
    void reason_ShouldOpenCircuitAfterFailuresAndRecoverAfterCooldown() {
        AiProviderProperties properties = baseProperties();
        properties.setReasoningRateLimitPerMinute(20);
        properties.setReasoningCircuitMinimumCalls(3);
        properties.setReasoningCircuitFailureThresholdPercent(30);
        properties.setReasoningCircuitWindowMinutes(5);
        properties.setReasoningCircuitCooldownMinutes(10);
        MutableClock clock = new MutableClock(Instant.parse("2026-07-13T03:10:00Z"));
        RecommendationReasoningGuardrailService guardrailService =
                new RecommendationReasoningGuardrailService(properties, clock);
        RecommendationReasoningServiceImpl service = new RecommendationReasoningServiceImpl(
                properties,
                aiProviderClient,
                new ObjectMapper(),
                guardrailService
        );

        when(aiProviderClient.reasonRecommendations(any()))
                .thenThrow(new IllegalStateException("AI provider request timed out."))
                .thenThrow(new IllegalStateException("AI provider request timed out."))
                .thenThrow(new IllegalStateException("AI provider request timed out."))
                .thenReturn(validRecommendationJson());

        for (int index = 0; index < 3; index++) {
            assertThrows(
                    IllegalStateException.class,
                    () -> service.reason(
                            sampleInput(),
                            RecommendationReasoningService.RecommendationReasoningMode.AI_STYLIST_CHAT,
                            "guest:test-circuit"
                    )
            );
            clock.advanceSeconds(30);
        }

        AiReasoningGuardrailException openCircuitError = assertThrows(
                AiReasoningGuardrailException.class,
                () -> service.reason(
                        sampleInput(),
                        RecommendationReasoningService.RecommendationReasoningMode.AI_STYLIST_CHAT,
                        "guest:test-circuit"
                )
        );
        assertEquals(RecommendationReasoningGuardrailService.FallbackReason.CIRCUIT_OPEN, openCircuitError.getFallbackReason());
        verify(aiProviderClient, times(3)).reasonRecommendations(any());
        assertTrue(guardrailService.snapshot().circuitOpen());

        clock.advanceSeconds(601);
        RecommendationReasoningOutput recovered = service.reason(
                sampleInput(),
                RecommendationReasoningService.RecommendationReasoningMode.AI_STYLIST_CHAT,
                "guest:test-circuit"
        );

        assertEquals("2", recovered.recommendations().get(0).costumeId());
        assertTrue(!guardrailService.snapshot().circuitOpen());
        verify(aiProviderClient, times(4)).reasonRecommendations(any());
    }

    private AiProviderProperties baseProperties() {
        AiProviderProperties properties = new AiProviderProperties();
        properties.setEnabled(true);
        properties.setReasoningRankingEnabled(true);
        properties.setChatModel("gemini-test");
        properties.setProviderBaseUrl("https://provider.example");
        properties.setProviderApiKey("secret");
        return properties;
    }

    private RecommendationReasoningInput sampleInput() {
        return new RecommendationReasoningInput(
                "Goi y cho toi mau phu hop",
                null,
                List.of(new RecommendationReasoningInput.CandidateCostume(
                        "2",
                        "Midnight Gown",
                        "Costume mo ta ngan",
                        null,
                        null,
                        "Elegant",
                        "Gala",
                        "Winter",
                        "Black",
                        "Events",
                        List.of("formal"),
                        null,
                        null,
                        "Satin",
                        "Ton dang",
                        "M",
                        2
                )),
                null,
                null
        );
    }

    private String validRecommendationJson() {
        return """
                {
                  "recommendations": [
                    {
                      "costumeId": "2",
                      "reasoning": "Mau nay phu hop vi cung phong cach gala thanh lich.",
                      "confidenceScore": 0.9,
                      "matchedAttributes": ["style: elegant", "occasion: gala"]
                    }
                  ],
                  "clarificationNeeded": null,
                  "noMatchReason": null
                }
                """;
    }

    private static final class MutableClock extends Clock {
        private Instant current;

        private MutableClock(Instant current) {
            this.current = current;
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return current;
        }

        private void advanceSeconds(long seconds) {
            current = current.plusSeconds(seconds);
        }
    }
}
