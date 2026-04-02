package com.rigs.rigs.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy cleanFailedMigrationsStrategy(DataSource dataSource) {
        return flyway -> {
            try (Connection c = dataSource.getConnection();
                 Statement s = c.createStatement()) {
                System.out.println("Executing explicit Flyway cleanup on MySQL...");
                // MySQL doesn't support transactional DDL, so Flyway refuses to repair failed migrations automatically.
                // We manually delete any failed history rows to unblock the Deployment.
                s.execute("DELETE FROM flyway_schema_history WHERE success = 0");
                System.out.println("Failed migrations purged successfully.");
            } catch (Exception e) {
                System.out.println("Could not clean flyway_schema_history (table might not exist yet): " + e.getMessage());
            }
            
            // Repair standard checksums and trigger migration
            flyway.repair();
            flyway.migrate();

            // Create indexes safely AFTER Flyway migration completes.
            // Using try-catch per index so existing indexes don't crash the startup.
            createIndexesSafely(dataSource);
        };
    }

    private void createIndexesSafely(DataSource dataSource) {
        System.out.println("Creating database indexes (idempotent)...");
        try (Connection c = dataSource.getConnection();
             Statement s = c.createStatement()) {

            safeCreateIndex(s, "idx_telemetry_machine_time",
                    "CREATE INDEX idx_telemetry_machine_time ON machine_telemetry (machine_id, `timestamp` DESC)");

            safeCreateIndex(s, "idx_machine_status",
                    "CREATE INDEX idx_machine_status ON machines (status)");

            safeCreateIndex(s, "idx_alerts_machine_severity",
                    "CREATE INDEX idx_alerts_machine_severity ON alerts (machine_id, severity)");

            safeCreateIndex(s, "idx_commands_machine_status",
                    "CREATE INDEX idx_commands_machine_status ON commands (machine_id, status)");

            System.out.println("Database indexes creation complete.");
        } catch (Exception e) {
            System.out.println("Error during index creation: " + e.getMessage());
        }
    }

    private void safeCreateIndex(Statement s, String indexName, String sql) {
        try {
            s.execute(sql);
            System.out.println("  Created index: " + indexName);
        } catch (Exception e) {
            // MySQL error 1061 = "Duplicate key name" (index already exists) — safe to ignore
            System.out.println("  Index " + indexName + " already exists or skipped: " + e.getMessage());
        }
    }
}
