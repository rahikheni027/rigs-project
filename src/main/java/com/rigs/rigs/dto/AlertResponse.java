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
public class AlertResponse {
    private Long id;
    private Long machineId;
    private String machineName;
    private String type;
    private String severity;
    private String message;
    private LocalDateTime createdAt;
    private Boolean acknowledged;
    private String acknowledgedBy;
}
