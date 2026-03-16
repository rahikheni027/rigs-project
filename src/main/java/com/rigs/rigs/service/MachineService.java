package com.rigs.rigs.service;

import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.entity.MachineTelemetry;
import com.rigs.rigs.entity.MachineSettings;
import com.rigs.rigs.entity.Alert;
import com.rigs.rigs.dto.MachineTelemetryResponse;
import com.rigs.rigs.repository.MachineRepository;
import com.rigs.rigs.repository.MachineSettingsRepository;
import com.rigs.rigs.repository.MachineTelemetryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MachineService {

    private static final long DEFAULT_HEARTBEAT_TIMEOUT = 60;
    private static final double DEFAULT_VIBRATION_THRESHOLD = 2.5;
    private static final double DEFAULT_RUNTIME_THRESHOLD = 5000.0;
    private static final double DEFAULT_TEMP_THRESHOLD = 85.0; // Overheat threshold

    private final MachineRepository machineRepository;
    private final MachineTelemetryRepository telemetryRepository;
    private final MachineSettingsRepository settingsRepository;
    private final AlertService alertService;

    @Transactional(readOnly = true)
    public List<MachineTelemetryResponse> getAllMachinesWithLatestTelemetry() {
        return machineRepository.findAll().stream()
                .map(this::buildTelemetryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MachineTelemetryResponse getMachineTelemetry(Long machineId) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found with id: " + machineId));
        return buildTelemetryResponse(machine);
    }

    private MachineTelemetryResponse buildTelemetryResponse(Machine machine) {
        MachineTelemetry latestTelemetry = telemetryRepository
                .findFirstByMachineOrderByTimestampDesc(machine)
                .orElse(null);

        MachineSettings settings = settingsRepository.findByMachine(machine).orElse(null);

        boolean isOnline = checkMachineOnline(machine, settings);

        return MachineTelemetryResponse.builder()
                .machineId(machine.getId())
                .machineName(machine.getName())
                .location(machine.getLocation())
                .status(machine.getStatus())
                .temperature(latestTelemetry != null ? latestTelemetry.getTemperature() : null)
                .vibration(latestTelemetry != null ? latestTelemetry.getVibration() : null)
                .currentDraw(latestTelemetry != null ? latestTelemetry.getCurrentDraw() : null)
                .rpm(latestTelemetry != null ? latestTelemetry.getRpm() : null)
                .pressure(latestTelemetry != null ? latestTelemetry.getPressure() : null)
                .powerConsumption(latestTelemetry != null ? latestTelemetry.getPowerConsumption() : null)
                .efficiency(latestTelemetry != null ? latestTelemetry.getEfficiency() : null)
                .errorRate(latestTelemetry != null ? latestTelemetry.getErrorRate() : null)
                .lastHeartbeat(machine.getLastHeartbeat())
                .isOnline(isOnline)
                .maintenanceAlert(machine.getMaintenanceAlert())
                .cumulativeRuntimeHours(machine.getCumulativeRuntimeHours())
                .timestamp(latestTelemetry != null ? latestTelemetry.getTimestamp() : null)
                .build();
    }

    private boolean checkMachineOnline(Machine machine, MachineSettings settings) {
        if (machine.getLastHeartbeat() == null)
            return false;

        long timeout = settings != null && settings.getHeartbeatTimeout() != null
                ? settings.getHeartbeatTimeout()
                : DEFAULT_HEARTBEAT_TIMEOUT;

        return ChronoUnit.SECONDS.between(machine.getLastHeartbeat(), LocalDateTime.now()) <= timeout;
    }

    @Transactional
    public void saveTelemetry(Long machineId, Double temperature, Double vibration,
            Double currentDraw, String machineStatus,
            Double rpm, Double pressure, Double powerConsumption,
            Double efficiency, Double errorRate) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found: " + machineId));

        MachineTelemetry telemetry = MachineTelemetry.builder()
                .machine(machine)
                .temperature(temperature)
                .vibration(vibration)
                .currentDraw(currentDraw)
                .machineStatus(machineStatus)
                .rpm(rpm)
                .pressure(pressure)
                .powerConsumption(powerConsumption)
                .efficiency(efficiency)
                .errorRate(errorRate)
                .timestamp(LocalDateTime.now())
                .build();

        telemetryRepository.save(telemetry);

        // Update machine
        machine.setStatus(machineStatus);
        machine.setLastHeartbeat(LocalDateTime.now());

        // Threshold Checks
        MachineSettings settings = settingsRepository.findByMachine(machine).orElse(null);
        checkAlerts(machine, telemetry, settings);

        machineRepository.save(machine);
    }

    @Transactional(readOnly = true)
    public List<MachineTelemetryResponse> getTelemetryHistory(Long machineId) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found: " + machineId));
        return telemetryRepository.findTop50ByMachineOrderByTimestampDesc(machine).stream()
                .map(t -> MachineTelemetryResponse.builder()
                        .machineId(machine.getId())
                        .machineName(machine.getName())
                        .temperature(t.getTemperature())
                        .vibration(t.getVibration())
                        .currentDraw(t.getCurrentDraw())
                        .rpm(t.getRpm())
                        .pressure(t.getPressure())
                        .powerConsumption(t.getPowerConsumption())
                        .efficiency(t.getEfficiency())
                        .errorRate(t.getErrorRate())
                        .status(t.getMachineStatus())
                        .timestamp(t.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    private void checkAlerts(Machine machine, MachineTelemetry telemetry, MachineSettings settings) {
        double runtimeLimit = settings != null ? settings.getRuntimeLimitHours() : DEFAULT_RUNTIME_THRESHOLD;
        double vibLimit = settings != null ? settings.getVibrationThreshold() : DEFAULT_VIBRATION_THRESHOLD;

        // Maintenance Alert
        if (machine.getCumulativeRuntimeHours() > runtimeLimit) {
            machine.setMaintenanceAlert(true);
            alertService.createAlert(machine, Alert.AlertType.MAINTENANCE, Alert.AlertSeverity.MEDIUM,
                    "Machine has exceeded runtime limit of " + runtimeLimit + " hours.");
        }

        // Overheat Alert
        if (telemetry.getTemperature() > DEFAULT_TEMP_THRESHOLD) {
            alertService.createAlert(machine, Alert.AlertType.OVERHEAT, Alert.AlertSeverity.CRITICAL,
                    "Critical temperature detected: " + telemetry.getTemperature() + "°C");
        }

        // High Vibration logic could also trigger alerts
        if (telemetry.getVibration() > vibLimit) {
            alertService.createAlert(machine, Alert.AlertType.MAINTENANCE, Alert.AlertSeverity.CRITICAL,
                    "High vibration detected: " + telemetry.getVibration() + "g");
        }
    }

    @Scheduled(fixedRate = 10000) // Check every 10 seconds
    @Transactional
    public void monitorHeartbeats() {
        List<Machine> machines = machineRepository.findAll();
        for (Machine m : machines) {
            if (!"OFFLINE".equals(m.getStatus())) {
                MachineSettings s = settingsRepository.findByMachine(m).orElse(null);
                if (!checkMachineOnline(m, s)) {
                    m.setStatus("OFFLINE");
                    machineRepository.save(m);
                    alertService.createAlert(m, Alert.AlertType.OFFLINE, Alert.AlertSeverity.CRITICAL,
                            "Machine heartbeat missing. Status marked as OFFLINE.");
                }
            }
        }
    }
}
