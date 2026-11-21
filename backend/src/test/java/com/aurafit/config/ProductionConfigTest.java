package com.aurafit.config;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies shipped prod/dev profile configuration as source-of-truth:
 * CORS defaults target the real Vercel domain and SePay credentials are
 * environment-driven (no hardcoded placeholder) in the YAML files.
 */
class ProductionConfigTest {

    @Test
    void prodYml_corsDefaultIncludesRealProdDomain() throws Exception {
        String yml = Files.readString(Path.of("src/main/resources/application-prod.yml"));
        assertThat(yml)
                .contains("https://aurafit-iota.vercel.app")
                .doesNotContain("aurafit-frontend.vercel.app");
    }

    @Test
    void devAndProdYml_sePayApiKeyIsEnvironmentDriven() throws Exception {
        String dev = Files.readString(Path.of("src/main/resources/application-dev.yml"));
        String prod = Files.readString(Path.of("src/main/resources/application-prod.yml"));
        for (String yml : new String[]{dev, prod}) {
            assertThat(yml).contains("api-key: ${SEPAY_API_KEY:}");
            assertThat(yml).doesNotContain("api-key: ***");
        }
    }
}
