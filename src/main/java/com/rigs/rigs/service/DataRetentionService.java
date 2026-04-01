package com.rigs.rigs.service;

import com.rigs.rigs.repository.MachineTelemetryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Data Retention Service
 * Ensures the 'machine_telemetry' table does not grow infinitely and crash the application.
 * Cleans up records older than a dynamic rolling threshold.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataRetentionService {

    private final MachineTelemetryRepository telemetryRepository;

    /**
     * Executes automatically at 2:00 AM every single day.
     * Deletes raw telemetry data older than 7 days.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldTelemetry() {
        log.info("Starting scheduled data retention cleanup...");
        
        // Define the cutoff window (7 days relative to right now)
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
        
        try {
            int deletedCount = telemetryRepository.deleteByTimestampBefore(cutoffDate);
            log.info("Data retention cleanup finished. Safely deleted {} legacy telemetry records.", deletedCount);
        } catch (Exception e) {
            log.error("Failed to execute data retention cleanup: {}", e.getMessage(), e);
        }
    }
}
