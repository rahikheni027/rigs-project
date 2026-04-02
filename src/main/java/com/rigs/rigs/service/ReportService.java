package com.rigs.rigs.service;

import com.rigs.rigs.dto.MachineTelemetryResponse;
import com.rigs.rigs.entity.Alert;
import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.repository.AlertRepository;
import com.rigs.rigs.repository.MachineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Phase 3 — PDF Report Generation Service.
 * Generates SCADA telemetry and alert reports as downloadable PDFs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final MachineService machineService;
    private final MachineRepository machineRepository;
    private final AlertRepository alertRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final float MARGIN = 40;
    private static final float LINE_HEIGHT = 14;

    /**
     * Generate a PDF report for a single machine.
     */
    public byte[] generateMachineReport(Long machineId) throws IOException {
        MachineTelemetryResponse current = machineService.getMachineTelemetry(machineId);
        List<MachineTelemetryResponse> history = machineService.getTelemetryHistory(machineId);

        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found: " + machineId));

        List<Alert> alerts = alertRepository.findAll(PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream().filter(a -> a.getMachine().getId().equals(machineId)).toList();

        try (PDDocument doc = new PDDocument()) {
            // Page 1: Machine Overview
            addMachineOverviewPage(doc, current, machine, alerts);

            // Page 2: Telemetry History Table
            addTelemetryHistoryPage(doc, history, machine.getName());

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    /**
     * Generate a full plant summary PDF.
     */
    public byte[] generatePlantReport() throws IOException {
        List<MachineTelemetryResponse> machines = machineService.getAllMachinesWithLatestTelemetry();
        List<Alert> recentAlerts = alertRepository.findAll(
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();

        try (PDDocument doc = new PDDocument()) {
            // Page 1: Plant Summary
            addPlantSummaryPage(doc, machines);

            // Page 2: Alert Summary
            addAlertSummaryPage(doc, recentAlerts);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    // ===== PAGE BUILDERS =====

    private void addMachineOverviewPage(PDDocument doc, MachineTelemetryResponse current,
                                         Machine machine, List<Alert> alerts) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        PDType1Font fontMono = new PDType1Font(Standard14Fonts.FontName.COURIER);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            float y = page.getMediaBox().getHeight() - MARGIN;

            // Title
            y = drawText(cs, "R.I.G.S. SCADA — MACHINE REPORT", fontBold, 16, MARGIN, y);
            y = drawText(cs, "Generated: " + LocalDateTime.now().format(FMT), fontRegular, 9, MARGIN, y - 4);
            y -= 20;

            // Machine Info
            y = drawText(cs, "MACHINE INFORMATION", fontBold, 12, MARGIN, y);
            y = drawLine(cs, MARGIN, y - 2, page.getMediaBox().getWidth() - MARGIN);
            y -= 6;
            y = drawKV(cs, "Name:", current.getMachineName(), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "ID:", String.valueOf(current.getMachineId()), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Type:", current.getMachineType() != null ? current.getMachineType() : "N/A", fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Location:", current.getLocation(), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Process Unit:", current.getProcessUnit() != null ? current.getProcessUnit() : "N/A", fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Status:", current.getStatus(), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Runtime:", String.format("%.1f hours", current.getCumulativeRuntimeHours() != null ? current.getCumulativeRuntimeHours() : 0), fontBold, fontRegular, MARGIN, y);
            y -= 16;

            // Current Telemetry
            y = drawText(cs, "CURRENT TELEMETRY", fontBold, 12, MARGIN, y);
            y = drawLine(cs, MARGIN, y - 2, page.getMediaBox().getWidth() - MARGIN);
            y -= 6;

            // Table header
            String[] headers = {"Parameter", "Value", "Unit", "Status"};
            float[] colWidths = {120, 80, 60, 80};
            y = drawTableRow(cs, headers, colWidths, fontBold, 9, MARGIN, y, true);

            // Metric rows
            String[][] metrics = {
                {"Temperature", fmt(current.getTemperature()), "°C", current.getTemperature() != null && current.getTemperature() > 85 ? "⚠ HIGH" : "NORMAL"},
                {"RPM", fmt0(current.getRpm()), "", "—"},
                {"Vibration", fmt(current.getVibration()), "g", current.getVibration() != null && current.getVibration() > 2.5 ? "⚠ HIGH" : "NORMAL"},
                {"Pressure", fmt(current.getPressure()), "PSI", "—"},
                {"Power", fmt(current.getPowerConsumption()), "kW", "—"},
                {"Efficiency", fmt(current.getEfficiency()), "%", current.getEfficiency() != null && current.getEfficiency() < 60 ? "LOW" : "NORMAL"},
                {"Current", fmt(current.getCurrentDraw()), "A", "—"},
                {"Error Rate", fmt3(current.getErrorRate()), "", current.getErrorRate() != null && current.getErrorRate() > 0.05 ? "⚠ HIGH" : "NORMAL"},
            };
            for (String[] row : metrics) {
                y = drawTableRow(cs, row, colWidths, fontMono, 9, MARGIN, y, false);
            }
            y -= 16;

            // Recent Alerts
            y = drawText(cs, "RECENT ALERTS (" + alerts.size() + ")", fontBold, 12, MARGIN, y);
            y = drawLine(cs, MARGIN, y - 2, page.getMediaBox().getWidth() - MARGIN);
            y -= 6;

            if (alerts.isEmpty()) {
                y = drawText(cs, "No alerts recorded for this machine.", fontRegular, 10, MARGIN, y);
            } else {
                for (Alert alert : alerts.subList(0, Math.min(alerts.size(), 8))) {
                    String line = String.format("[%s] %s — %s",
                            alert.getSeverity(), alert.getType(),
                            alert.getMessage() != null ? alert.getMessage().substring(0, Math.min(alert.getMessage().length(), 70)) : "");
                    y = drawText(cs, line, fontRegular, 8, MARGIN, y);
                    if (y < MARGIN + 20) break;
                }
            }
        }
    }

    private void addTelemetryHistoryPage(PDDocument doc, List<MachineTelemetryResponse> history,
                                          String machineName) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontMono = new PDType1Font(Standard14Fonts.FontName.COURIER);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            float y = page.getMediaBox().getHeight() - MARGIN;

            y = drawText(cs, "TELEMETRY HISTORY — " + machineName, fontBold, 14, MARGIN, y);
            y -= 14;

            String[] headers = {"Time", "Temp°C", "RPM", "Vib(g)", "Pres(PSI)", "Power(kW)", "Eff(%)"};
            float[] colWidths = {90, 60, 55, 55, 65, 65, 55};
            y = drawTableRow(cs, headers, colWidths, fontBold, 8, MARGIN, y, true);

            for (MachineTelemetryResponse t : history) {
                String time = t.getTimestamp() != null ? t.getTimestamp().format(DateTimeFormatter.ofPattern("HH:mm:ss")) : "—";
                String[] row = {time, fmt(t.getTemperature()), fmt0(t.getRpm()), fmt(t.getVibration()),
                        fmt(t.getPressure()), fmt(t.getPowerConsumption()), fmt(t.getEfficiency())};
                y = drawTableRow(cs, row, colWidths, fontMono, 8, MARGIN, y, false);
                if (y < MARGIN + 20) break;
            }
        }
    }

    private void addPlantSummaryPage(PDDocument doc, List<MachineTelemetryResponse> machines) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        PDType1Font fontMono = new PDType1Font(Standard14Fonts.FontName.COURIER);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            float y = page.getMediaBox().getHeight() - MARGIN;

            y = drawText(cs, "R.I.G.S. SCADA — PLANT SUMMARY REPORT", fontBold, 16, MARGIN, y);
            y = drawText(cs, "Generated: " + LocalDateTime.now().format(FMT), fontRegular, 9, MARGIN, y - 4);
            y -= 24;

            // KPIs
            long running = machines.stream().filter(m -> "RUNNING".equals(m.getStatus())).count();
            double avgTemp = machines.stream().mapToDouble(m -> m.getTemperature() != null ? m.getTemperature() : 0).average().orElse(0);
            double totalPower = machines.stream().mapToDouble(m -> m.getPowerConsumption() != null ? m.getPowerConsumption() : 0).sum();
            double avgEff = machines.stream().mapToDouble(m -> m.getEfficiency() != null ? m.getEfficiency() : 0).average().orElse(0);

            y = drawText(cs, "PLANT KPIs", fontBold, 12, MARGIN, y);
            y = drawLine(cs, MARGIN, y - 2, page.getMediaBox().getWidth() - MARGIN);
            y -= 6;
            y = drawKV(cs, "Total Machines:", String.valueOf(machines.size()), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Running:", running + "/" + machines.size(), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Avg Temperature:", String.format("%.1f °C", avgTemp), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Total Power:", String.format("%.1f kW", totalPower), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Avg Efficiency:", String.format("%.1f%%", avgEff), fontBold, fontRegular, MARGIN, y);
            y -= 20;

            // Machine Table
            y = drawText(cs, "MACHINE STATUS", fontBold, 12, MARGIN, y);
            y = drawLine(cs, MARGIN, y - 2, page.getMediaBox().getWidth() - MARGIN);
            y -= 6;

            String[] headers = {"Machine", "Status", "Type", "Temp°C", "RPM", "Power(kW)", "Eff(%)"};
            float[] colWidths = {100, 70, 70, 55, 55, 65, 50};
            y = drawTableRow(cs, headers, colWidths, fontBold, 8, MARGIN, y, true);

            for (MachineTelemetryResponse m : machines) {
                String name = m.getMachineName() != null ? m.getMachineName().substring(0, Math.min(m.getMachineName().length(), 15)) : "—";
                String[] row = {name, m.getStatus(), m.getMachineType() != null ? m.getMachineType() : "N/A",
                        fmt(m.getTemperature()), fmt0(m.getRpm()), fmt(m.getPowerConsumption()), fmt(m.getEfficiency())};
                y = drawTableRow(cs, row, colWidths, fontMono, 8, MARGIN, y, false);
                if (y < MARGIN + 20) break;
            }
        }
    }

    private void addAlertSummaryPage(PDDocument doc, List<Alert> alerts) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            float y = page.getMediaBox().getHeight() - MARGIN;

            y = drawText(cs, "ALERT SUMMARY", fontBold, 14, MARGIN, y);
            y -= 10;

            long critical = alerts.stream().filter(a -> a.getSeverity() == Alert.AlertSeverity.CRITICAL).count();
            long medium = alerts.stream().filter(a -> a.getSeverity() == Alert.AlertSeverity.MEDIUM).count();
            long unack = alerts.stream().filter(a -> !a.getAcknowledged()).count();

            y = drawKV(cs, "Total Alerts:", String.valueOf(alerts.size()), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Critical:", String.valueOf(critical), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Medium:", String.valueOf(medium), fontBold, fontRegular, MARGIN, y);
            y = drawKV(cs, "Unacknowledged:", String.valueOf(unack), fontBold, fontRegular, MARGIN, y);
            y -= 14;

            y = drawText(cs, "RECENT ALERTS", fontBold, 12, MARGIN, y);
            y = drawLine(cs, MARGIN, y - 2, page.getMediaBox().getWidth() - MARGIN);
            y -= 6;

            for (Alert alert : alerts.subList(0, Math.min(alerts.size(), 25))) {
                String time = alert.getCreatedAt() != null ? alert.getCreatedAt().format(DateTimeFormatter.ofPattern("MM-dd HH:mm")) : "—";
                String line = String.format("[%s] %s | %s — %s", time, alert.getSeverity(), alert.getType(),
                        alert.getMessage() != null ? alert.getMessage().substring(0, Math.min(alert.getMessage().length(), 55)) : "");
                y = drawText(cs, line, fontRegular, 8, MARGIN, y);
                if (y < MARGIN + 20) break;
            }
        }
    }

    // ===== PDF HELPER METHODS =====

    private float drawText(PDPageContentStream cs, String text, PDType1Font font, float size, float x, float y) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - LINE_HEIGHT;
    }

    private float drawKV(PDPageContentStream cs, String key, String value, PDType1Font keyFont,
                          PDType1Font valueFont, float x, float y) throws IOException {
        cs.beginText();
        cs.setFont(keyFont, 10);
        cs.newLineAtOffset(x, y);
        cs.showText(key);
        cs.setFont(valueFont, 10);
        cs.newLineAtOffset(100, 0);
        cs.showText(value);
        cs.endText();
        return y - LINE_HEIGHT;
    }

    private float drawLine(PDPageContentStream cs, float x1, float y, float x2) throws IOException {
        cs.moveTo(x1, y);
        cs.lineTo(x2, y);
        cs.setLineWidth(0.5f);
        cs.stroke();
        return y - 4;
    }

    private float drawTableRow(PDPageContentStream cs, String[] cells, float[] widths,
                                PDType1Font font, float size, float x, float y, boolean isHeader) throws IOException {
        float cx = x;
        cs.beginText();
        cs.setFont(font, size);
        for (int i = 0; i < cells.length && i < widths.length; i++) {
            cs.newLineAtOffset(i == 0 ? cx : widths[i - 1], 0);
            String cell = cells[i] != null ? cells[i] : "—";
            cs.showText(cell);
        }
        cs.endText();
        return y - (isHeader ? LINE_HEIGHT + 2 : LINE_HEIGHT);
    }

    private String fmt(Double val) { return val != null ? String.format("%.1f", val) : "—"; }
    private String fmt0(Double val) { return val != null ? String.format("%.0f", val) : "—"; }
    private String fmt3(Double val) { return val != null ? String.format("%.3f", val) : "—"; }
}
