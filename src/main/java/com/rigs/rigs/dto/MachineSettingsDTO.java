package com.rigs.rigs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineSettingsDTO {
    private Long machineId;
    private String machineName;
    private String location;
    private Double vibrationThreshold;
    private Double runtimeLimitHours;
    private Double temperatureThreshold;
    private Integer heartbeatTimeout;
    private Boolean sensorEnabled;
}
