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
        };
    }
}
