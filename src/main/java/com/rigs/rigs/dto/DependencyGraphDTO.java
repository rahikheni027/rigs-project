package com.rigs.rigs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DependencyGraphDTO {
    private List<NodeDTO> nodes;
    private List<EdgeDTO> edges;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NodeDTO {
        private Long id;
        private String name;
        private String type;
        private String status;
        private String processUnit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EdgeDTO {
        private Long id;
        private Long source;
        private Long target;
        private String type;
        private boolean propagateStop;
    }
}
