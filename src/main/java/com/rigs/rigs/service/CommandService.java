package com.rigs.rigs.service;

import com.rigs.rigs.entity.Command;
import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.repository.CommandRepository;
import com.rigs.rigs.repository.MachineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommandService {

    private final CommandRepository commandRepository;
    private final MachineRepository machineRepository;
    private final MqttListenerService mqttService;

    @Transactional
    public Command issueCommand(Long machineId, String type, String parameters, String issuedBy) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found: " + machineId));

        String targetStatus = mapCommandToStatus(type);
        if (targetStatus != null) {
            machine.setStatus(targetStatus);
            machineRepository.save(machine);
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
