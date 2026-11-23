package com.aurafit.config;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies actuator configuration shipped in application.yml as source-of-truth.
 * Plain file test: no Spring context, so it passes in CI without a live DB or
 * local .env file.
 */
class ActuatorConfigurationTest {

    @Test
    void applicationYml_exposesHealthAndInfoAndEnablesProbes() throws Exception {
        String yml = Files.readString(Path.of("src/main/resources/application.yml"));

        assertThat(yml).contains("include: health,info,metrics");
        assertThat(yml).contains("probes:");
        assertThat(yml).contains("enabled: true");
        assertThat(yml).contains("show-details: never");
        assertThat(yml).contains("mail:");
        assertThat(yml).contains("enabled: false");
        assertThat(yml).contains("readiness:");
        assertThat(yml).contains("application: aurafit-backend");
    }
}
