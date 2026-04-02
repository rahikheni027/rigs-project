package com.rigs.rigs.controller;

import com.rigs.rigs.dto.DependencyEdgeDTO;
import com.rigs.rigs.dto.DependencyGraphDTO;
import com.rigs.rigs.service.DependencyGraphService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dependencies")
@RequiredArgsConstructor
@Slf4j
public class DependencyController {

    private final DependencyGraphService dependencyGraphService;

    @GetMapping("/graph")
    public ResponseEntity<DependencyGraphDTO> getFullGraph() {
        log.debug("Fetching full dependency graph");
        return ResponseEntity.ok(dependencyGraphService.getFullGraph());
    }

    @PostMapping
    public ResponseEntity<?> createDependency(@RequestBody DependencyEdgeDTO request) {
        log.info("Creating new dependency: {} -> {}", request.getParentMachineId(), request.getChildMachineId());
        try {
            DependencyEdgeDTO result = dependencyGraphService.createDependency(
                    request.getParentMachineId(),
                    request.getChildMachineId(),
                    request.getDependencyType(),
                    request.isPropagateStop(),
                    request.isPropagateEmergency()
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDependency(@PathVariable Long id) {
        log.info("Deleting dependency edge {}", id);
        dependencyGraphService.deleteDependency(id);
        return ResponseEntity.ok(Map.of("status", "deleted", "id", id));
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateCycle(@RequestParam Long parentId, @RequestParam Long childId) {
        boolean hasCycle = dependencyGraphService.createsCycle(parentId, childId);
        return ResponseEntity.ok(Map.of("hasCycle", hasCycle));
    }
}
