package com.rigs.rigs.service;

import com.rigs.rigs.entity.Alert;
import com.rigs.rigs.entity.Command;
import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.repository.CommandRepository;
import com.rigs.rigs.repository.MachineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class CommandService {

    private final CommandRepository commandRepository;
    private final MachineRepository machineRepository;
    private final MqttListenerService mqttService;
    private final MachineService machineService;
    private final SseService sseService;
    private final DependencyGraphService dependencyGraphService;
    private final AlertEngineService alertEngineService;

    public CommandService(CommandRepository commandRepository,
                          MachineRepository machineRepository,
                          @Lazy MqttListenerService mqttService,
                          @Lazy MachineService machineService,
                          SseService sseService,
                          @Lazy DependencyGraphService dependencyGraphService,
                          @Lazy AlertEngineService alertEngineService) {
        this.commandRepository = commandRepository;
        this.machineRepository = machineRepository;
        this.mqttService = mqttService;
        this.machineService = machineService;
        this.sseService = sseService;
        this.dependencyGraphService = dependencyGraphService;
        this.alertEngineService = alertEngineService;
    }

    @Transactional
    public Command issueCommand(Long machineId, String type, String parameters, String issuedBy) {
        return issueCommand(machineId, type, parameters, issuedBy, false);
    }

    @Transactional
    public Command issueCommand(Long machineId, String type, String parameters, String issuedBy, boolean force) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found: " + machineId));

        String targetStatus = mapCommandToStatus(type);
        
        // START VALIDATION: Check if upstream parents allow start
        if (targetStatus != null && targetStatus.equals("RUNNING") && !force) {
            if (!dependencyGraphService.canStart(machineId)) {
                List<String> stoppedParents = dependencyGraphService.getStoppedParents(machineId);
                String msg = "Start blocked by dependency. Upstream machines are not running: " + String.join(", ", stoppedParents);
                log.warn(msg);
                
                alertEngineService.fireDependencyAlert(machine, Alert.AlertType.DEPENDENCY_BLOCKED_START, Alert.AlertSeverity.MEDIUM, msg);
                
                // Return a failed command record
                Command failedCmd = Command.builder()
                        .machine(machine)
                        .commandType(type)
                        .parameters(parameters)
                        .issuedBy(issuedBy)
                        .issuedAt(LocalDateTime.now())
                        .status("FAILED_DEPENDENCY")
                        .responsePayload(msg)
                        .build();
                return commandRepository.save(failedCmd);
            }
        }
        
        if (force && targetStatus != null && targetStatus.equals("RUNNING")) {
            alertEngineService.fireDependencyAlert(machine, Alert.AlertType.DEPENDENCY_OVERRIDE, Alert.AlertSeverity.LOW, "Manual override used to bypass dependency start lock.");
        }

        if (targetStatus != null) {
            machine.setStatus(targetStatus);
            machineRepository.save(machine);
            // Lock the status so incoming telemetry doesn't overwrite it
            machineService.registerCommandLock(machineId);
        }

        Command cmd = Command.builder()
                .machine(machine)
                .commandType(type)
                .parameters(parameters)
                .issuedBy(issuedBy)
                .issuedAt(LocalDateTime.now())
                .status("PENDING")
                .build();

        commandRepository.save(cmd);
        log.info("Issuer {} sent {} to machine {}", issuedBy, type, machineId);

        mqttService.sendCommand(machineId, type);

        // INSTANT SSE PUSH ON COMMAND OVERRIDE
        if (targetStatus != null) {
            sseService.broadcastTelemetry(machineService.getMachineTelemetry(machineId));
            
            // PROPAGATE CASCADING STOP/EMERGENCY down the graph
            if ("DEPENDENCY_CASCADE".equals(issuedBy)) {
                // If it's already a cascade, DependencyGraphService is handling the queue
                // so we don't need to recursively call it here.
            } else {
                dependencyGraphService.propagateCommand(machineId, type, issuedBy);
            }
        }

        return cmd;
    }

    private String mapCommandToStatus(String command) {
        return switch (command.toUpperCase()) {
            case "START", "RESET" -> "RUNNING";
            case "STOP" -> "STOPPED";
            case "EMERGENCY_STOP" -> "EMERGENCY";
            case "MAINTENANCE_MODE" -> "MAINTENANCE";
            case "CALIBRATION" -> "CALIBRATING";
            default -> null;
        };
    }
}
