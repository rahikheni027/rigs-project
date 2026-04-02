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
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MachineService {

    private static final long DEFAULT_HEARTBEAT_TIMEOUT = 120;
    private static final double DEFAULT_VIBRATION_THRESHOLD = 2.5;
    private static final double DEFAULT_RUNTIME_THRESHOLD = 5000.0;
    private static final double DEFAULT_TEMP_THRESHOLD = 85.0;

    /** Duration in seconds for which a commanded status is locked from telemetry overwrite */
    private static final long COMMAND_LOCK_DURATION_SECONDS = 15;

    private final MachineRepository machineRepository;
    private final MachineTelemetryRepository telemetryRepository;
    private final MachineSettingsRepository settingsRepository;
    private final AlertService alertService;
    private final SseService sseService;
    private final AlertEngineService alertEngineService;
    private final DependencyGraphService dependencyGraphService;

    public MachineService(MachineRepository machineRepository,
                          MachineTelemetryRepository telemetryRepository,
                          MachineSettingsRepository settingsRepository,
                          AlertService alertService,
                          SseService sseService,
                          AlertEngineService alertEngineService,
                          @Lazy DependencyGraphService dependencyGraphService) {
        this.machineRepository = machineRepository;
        this.telemetryRepository = telemetryRepository;
        this.settingsRepository = settingsRepository;
        this.alertService = alertService;
        this.sseService = sseService;
        this.alertEngineService = alertEngineService;
        this.dependencyGraphService = dependencyGraphService;
    }

    /** In-memory map tracking command lock timestamps per machine ID */
    private final Map<Long, LocalDateTime> commandLocks = new ConcurrentHashMap<>();

    // ===== COMMAND LOCK MANAGEMENT =====

    /**
     * Registers a command lock for a machine. While active, incoming telemetry
     * will NOT overwrite the machine's commanded status.
     */
    public void registerCommandLock(Long machineId) {
        commandLocks.put(machineId, LocalDateTime.now());
        log.info("Command lock registered for machine {} ({}s)", machineId, COMMAND_LOCK_DURATION_SECONDS);
    }

    /**
     * Checks if a machine has an active command lock.
     */
    private boolean hasActiveCommandLock(Long machineId) {
        LocalDateTime lockTime = commandLocks.get(machineId);
        if (lockTime == null) return false;

        long elapsed = ChronoUnit.SECONDS.between(lockTime, LocalDateTime.now());
        if (elapsed > COMMAND_LOCK_DURATION_SECONDS) {
            commandLocks.remove(machineId);
            return false;
        }
        return true;
    }

    // ===== TELEMETRY QUERIES =====

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

        // Get raw telemetry values
        Double temp = latestTelemetry != null ? latestTelemetry.getTemperature() : null;
        Double vib = latestTelemetry != null ? latestTelemetry.getVibration() : null;
        Double cur = latestTelemetry != null ? latestTelemetry.getCurrentDraw() : null;
        Double rpm = latestTelemetry != null ? latestTelemetry.getRpm() : null;
        Double pres = latestTelemetry != null ? latestTelemetry.getPressure() : null;
        Double power = latestTelemetry != null ? latestTelemetry.getPowerConsumption() : null;
        Double eff = latestTelemetry != null ? latestTelemetry.getEfficiency() : null;
        Double err = latestTelemetry != null ? latestTelemetry.getErrorRate() : null;

        String status = machine.getStatus();

        List<Long> upstream = dependencyGraphService.getUpstreamEdges(machine).stream()
                .map(d -> d.getParentMachine().getId())
                .collect(Collectors.toList());
                
        List<Long> downstream = dependencyGraphService.getDownstreamEdges(machine).stream()
                .map(d -> d.getChildMachine().getId())
                .collect(Collectors.toList());

        return MachineTelemetryResponse.builder()
                .machineId(machine.getId())
                .machineName(machine.getName())
                .location(machine.getLocation())
                .status(status)
                .machineType(machine.getMachineType())
                .processUnit(machine.getProcessUnit())
                .temperature(temp)
                .vibration(vib)
                .currentDraw(cur)
                .rpm(rpm)
                .pressure(pres)
                .powerConsumption(power)
                .efficiency(eff)
                .errorRate(err)
                .lastHeartbeat(machine.getLastHeartbeat())
                .isOnline(isOnline)
                .maintenanceAlert(machine.getMaintenanceAlert())
                .cumulativeRuntimeHours(machine.getCumulativeRuntimeHours())
                .timestamp(latestTelemetry != null ? latestTelemetry.getTimestamp() : null)
                .upstreamDependencies(upstream)
                .downstreamDependencies(downstream)
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

    // ===== TELEMETRY INGESTION =====

    @Transactional
    public void saveTelemetry(Long machineId, Double temperature, Double vibration,
            Double currentDraw, String machineStatus,
            Double rpm, Double pressure, Double powerConsumption,
            Double efficiency, Double errorRate) {
        // Auto-create machine if it doesn't exist
        String[] MACHINE_TYPES = { "MOTOR", "PUMP", "COMPRESSOR", "TURBINE", "GENERATOR" };
        String[] MACHINE_NAMES = { "Hydraulic Press", "Centrifugal Pump", "Air Compressor", "Steam Turbine",
                "Diesel Generator", "CNC Mill", "Ball Mill", "Cooling Tower" };
        String[] LOCATIONS = { "Plant Floor A", "Plant Floor B", "Utility Wing", "Generator Room", "Assembly Line" };
        String[] UNITS = { "Unit A", "Unit B", "Unit C" };

        Machine machine = machineRepository.findById(machineId).orElseGet(() -> {
            int idx = (int) (machineId % MACHINE_NAMES.length);
            Machine newMachine = Machine.builder()
                    .name(MACHINE_NAMES[idx])
                    .location(LOCATIONS[(int) (machineId % LOCATIONS.length)])
                    .machineType(MACHINE_TYPES[(int) (machineId % MACHINE_TYPES.length)])
                    .processUnit(UNITS[(int) (machineId % UNITS.length)])
                    .status("RUNNING")
                    .build();
            newMachine = machineRepository.save(newMachine);
            log.info("Auto-created machine: {} (ID={})", newMachine.getName(), newMachine.getId());
            return newMachine;
        });

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

        // COMMAND LOCK: Only overwrite status if there's no active command lock
        if (hasActiveCommandLock(machineId)) {
            log.debug("Machine {} status locked by command — keeping '{}', ignoring incoming '{}'",
                    machineId, machine.getStatus(), machineStatus);
            // Keep the commanded status, don't overwrite
        } else {
            machine.setStatus(machineStatus);
        }

        machine.setLastHeartbeat(LocalDateTime.now());

        // Threshold Checks
        MachineSettings settings = settingsRepository.findByMachine(machine).orElse(null);
        checkAlerts(machine, telemetry, settings);

        machineRepository.save(machine);

        // Phase 3: Feed telemetry into the Alert Engine for pattern analysis
        alertEngineService.analyzeTelemetry(machine, telemetry);

        // INSTANT SSE PUSH
        MachineTelemetryResponse response = buildTelemetryResponse(machine);
        sseService.broadcastTelemetry(response);
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

        if (machine.getCumulativeRuntimeHours() > runtimeLimit) {
            machine.setMaintenanceAlert(true);
            alertService.createAlert(machine, Alert.AlertType.MAINTENANCE, Alert.AlertSeverity.MEDIUM,
                    "Machine has exceeded runtime limit of " + runtimeLimit + " hours.");
        }

        if (telemetry.getTemperature() > DEFAULT_TEMP_THRESHOLD) {
            alertService.createAlert(machine, Alert.AlertType.OVERHEAT, Alert.AlertSeverity.CRITICAL,
                    "Critical temperature detected: " + telemetry.getTemperature() + "°C");
        }

        if (telemetry.getVibration() > vibLimit) {
            alertService.createAlert(machine, Alert.AlertType.MAINTENANCE, Alert.AlertSeverity.CRITICAL,
                    "High vibration detected: " + telemetry.getVibration() + "g");
        }
    }

    @Scheduled(fixedRate = 30000)
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

        // Phase 3: Run plant-wide power analysis periodically
        alertEngineService.analyzePlantPower(machines);
    }
}
