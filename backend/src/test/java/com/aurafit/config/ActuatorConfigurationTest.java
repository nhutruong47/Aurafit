package com.aurafit.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the actuator configuration properties shipped in application.yml.
 * Deliberately avoids component scanning the app's config package (seeders
 * need a live DataSource); only Spring Boot auto-configuration is loaded.
 */
@SpringBootTest(classes = ActuatorConfigurationTest.MinimalConfig.class)
@TestPropertySource(properties = {"spring.main.web-application-type=none"})
class ActuatorConfigurationTest {

    @EnableAutoConfiguration
    @Configuration
    static class MinimalConfig {
    }

    @Autowired
    private Environment environment;

    @Test
    void applicationYml_exposesHealthAndInfoAndEnablesProbes() {
        assertThat(environment.getProperty("management.endpoints.web.exposure.include"))
                .contains("health", "info", "metrics");
        assertThat(environment.getProperty("management.endpoint.health.probes.enabled"))
                .isEqualTo("true");
        assertThat(environment.getProperty("management.endpoint.health.show-details"))
                .isEqualTo("never");
        assertThat(environment.getProperty("management.endpoint.health.exclude"))
                .isEqualTo("mail");
        assertThat(environment.getProperty("management.endpoint.health.group.readiness.include"))
                .contains("db");
    }
}
