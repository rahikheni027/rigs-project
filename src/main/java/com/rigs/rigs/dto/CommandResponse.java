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
public class CommandResponse {
    private Long id;
    private Long machineId;
    private String commandType;
    private String status;
    private String issuedBy;
    private LocalDateTime issuedAt;
}
