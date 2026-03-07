package com.rigs.rigs.service;

import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.entity.MachineSettings;
import com.rigs.rigs.dto.MachineSettingsDTO;
import com.rigs.rigs.repository.MachineRepository;
import com.rigs.rigs.repository.MachineSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MachineSettingsService {

    private final MachineSettingsRepository settingsRepository;
    private final MachineRepository machineRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public MachineSettings getOrCreateSettings(Long machineId) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found: " + machineId));

        return settingsRepository.findByMachine(machine).orElseGet(() -> {
            MachineSettings defaults = MachineSettings.builder()
                    .machine(machine)
                    .vibrationThreshold(2.5)
                    .runtimeLimitHours(5000.0)
                    .heartbeatTimeout(60L)
                    .build();
            log.info("Created default settings for machine: {}", machine.getName());
            return settingsRepository.save(defaults);
        });
    }

    @Transactional(readOnly = true)
    public List<MachineSettingsDTO> getAllSettings() {
        return machineRepository.findAll().stream().map(machine -> {
            MachineSettings settings = settingsRepository.findByMachine(machine).orElse(null);
            return MachineSettingsDTO.builder()
                    .machineId(machine.getId())
                    .machineName(machine.getName())
                    .location(machine.getLocation())
                    .vibrationThreshold(settings != null ? settings.getVibrationThreshold() : 2.5)
                    .runtimeLimitHours(settings != null ? settings.getRuntimeLimitHours() : 5000.0)
                    .heartbeatTimeout(settings != null ? settings.getHeartbeatTimeout().intValue() : 60)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void updateSettings(Long machineId, Double vibrationThreshold, Double runtimeLimitHours,
            Integer heartbeatTimeout, String userEmail, String ipAddress) {

        MachineSettings settings = getOrCreateSettings(machineId);

        String beforeState = String.format("{\"vib\":%.2f,\"runtime\":%.2f,\"timeout\":%d}",
                settings.getVibrationThreshold(), settings.getRuntimeLimitHours(), settings.getHeartbeatTimeout());

        if (vibrationThreshold != null)
            settings.setVibrationThreshold(vibrationThreshold);
        if (runtimeLimitHours != null)
            settings.setRuntimeLimitHours(runtimeLimitHours);
        if (heartbeatTimeout != null)
            settings.setHeartbeatTimeout(heartbeatTimeout.longValue());

        settingsRepository.save(settings);

        String afterState = String.format("{\"vib\":%.2f,\"runtime\":%.2f,\"timeout\":%d}",
                settings.getVibrationThreshold(), settings.getRuntimeLimitHours(), settings.getHeartbeatTimeout());

        auditLogService.logAction(userEmail, "CONFIG_CHANGE", "MachineSettings",
                afterState, ipAddress, "INFO", machineId);

        log.info("Settings updated for machine {}: {}", machineId, afterState);
    }
}
