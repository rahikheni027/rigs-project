package com.rigs.rigs.controller;

import com.rigs.rigs.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Phase 3 — Report generation endpoints.
 * Generates and serves downloadable PDF reports.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/machine/{machineId}")
    public ResponseEntity<byte[]> getMachineReport(@PathVariable Long machineId) {
        try {
            byte[] pdf = reportService.generateMachineReport(machineId);
            String filename = String.format("rigs_machine_%d_%s.pdf", machineId, LocalDate.now());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdf.length)
                    .body(pdf);
        } catch (Exception e) {
            log.error("Failed to generate machine report for ID {}: {}", machineId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/plant")
    public ResponseEntity<byte[]> getPlantReport() {
        try {
            byte[] pdf = reportService.generatePlantReport();
            String filename = String.format("rigs_plant_report_%s.pdf", LocalDate.now());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdf.length)
                    .body(pdf);
        } catch (Exception e) {
            log.error("Failed to generate plant report: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
