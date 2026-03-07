package com.rigs.rigs.controller;

import com.rigs.rigs.dto.MachineTelemetryResponse;
import com.rigs.rigs.service.MachineService;
import com.rigs.rigs.service.CommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/machines")
@RequiredArgsConstructor
@Slf4j
public class MachineController {

    private final MachineService machineService;
    private final CommandService commandService;

    @GetMapping
    public ResponseEntity<List<MachineTelemetryResponse>> getAllMachines() {
        log.debug("Fetching all machines with telemetry");
        return ResponseEntity.ok(machineService.getAllMachinesWithLatestTelemetry());
    }

    @GetMapping("/{machineId}")
    public ResponseEntity<MachineTelemetryResponse> getMachineTelemetry(@PathVariable Long machineId) {
        log.debug("Fetching telemetry for machine ID: {}", machineId);
        return ResponseEntity.ok(machineService.getMachineTelemetry(machineId));
    }

    @PostMapping("/{machineId}/command")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sendCommand(@PathVariable Long machineId, @RequestParam String command,
            @RequestParam(required = false) String issuedBy) {
        log.info("Sending command '{}' to machine {}", command, machineId);
        commandService.issueCommand(machineId, command.toUpperCase(), null, issuedBy != null ? issuedBy : "ADMIN");
        return ResponseEntity.ok(Map.of("status", "sent", "command", command.toUpperCase()));
    }
}
