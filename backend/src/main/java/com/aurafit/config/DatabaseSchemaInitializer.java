package com.aurafit.config;

import com.aurafit.business.catalog.enums.ItemStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Component
public class DatabaseSchemaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        syncCostumeItemStatusConstraint();
    }

    private void syncCostumeItemStatusConstraint() {
        Boolean tableExists = jdbcTemplate.queryForObject(
                "SELECT to_regclass('public.costume_items') IS NOT NULL",
                Boolean.class
        );

        if (!Boolean.TRUE.equals(tableExists)) {
            return;
        }

        String allowedStatuses = Arrays.stream(ItemStatus.values())
                .map(status -> "'" + status.name() + "'")
                .collect(Collectors.joining(", "));

        jdbcTemplate.execute("ALTER TABLE costume_items DROP CONSTRAINT IF EXISTS costume_items_status_check");
        jdbcTemplate.execute(
                "ALTER TABLE costume_items ADD CONSTRAINT costume_items_status_check " +
                        "CHECK (status IN (" + allowedStatuses + "))"
        );

        log.info("Synchronized costume_items.status check constraint with ItemStatus enum.");
    }
}
