package com.aurafit.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiConfigurationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer());

    @Test
    void applicationConfiguration_shouldMapGeminiEnvironmentVariables() {
        contextRunner
                .withSystemProperties(
                        "GEMINI_API_KEY=test-gemini-key",
                        "GEMINI_MODEL=test-gemini-model",
                        "GEMINI_BASE_URL=https://gemini.test/v1beta",
                        "GEMINI_TIMEOUT_MS=12345",
                        "GEMINI_THINKING_BUDGET=0"
                )
                .run(context -> {
                    assertThat(context.getEnvironment().getProperty("ai.gemini.api-key"))
                            .isEqualTo("test-gemini-key");
                    assertThat(context.getEnvironment().getProperty("ai.gemini.model"))
                            .isEqualTo("test-gemini-model");
                    assertThat(context.getEnvironment().getProperty("ai.gemini.base-url"))
                            .isEqualTo("https://gemini.test/v1beta");
                    assertThat(context.getEnvironment().getProperty("ai.gemini.timeout-ms", Long.class))
                            .isEqualTo(12345L);
                    assertThat(context.getEnvironment().getProperty("ai.gemini.thinking-budget", Integer.class))
                            .isZero();
                });
    }
}
