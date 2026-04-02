package com.rigs.rigs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DependencyEdgeDTO {
    private Long id;
    private Long parentMachineId;
    private String parentMachineName;
    private Long childMachineId;
    private String childMachineName;
    private String dependencyType;
    private boolean propagateStop;
    private boolean propagateEmergency;
}
