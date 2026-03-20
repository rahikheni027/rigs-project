package com.rigs.rigs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineTelemetryResponse {
    private Long machineId;
    private String machineName;
    private String location;
    private String status;
    private String machineType;
    private String processUnit;
    private Double temperature;
    private Double vibration;
    private Double currentDraw;
    private Double rpm;
    private Double pressure;
    private Double powerConsumption;
    private Double efficiency;
    private Double errorRate;
    private LocalDateTime lastHeartbeat;
    private boolean isOnline;
    private boolean maintenanceAlert;
    private Double cumulativeRuntimeHours;
    private LocalDateTime timestamp;
}
