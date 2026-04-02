package com.rigs.rigs.service;

import com.rigs.rigs.dto.DependencyEdgeDTO;
import com.rigs.rigs.dto.DependencyGraphDTO;
import com.rigs.rigs.entity.Alert;
import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.entity.MachineDependency;
import com.rigs.rigs.repository.MachineDependencyRepository;
import com.rigs.rigs.repository.MachineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DependencyGraphService {

    private final MachineDependencyRepository dependencyRepository;
    private final MachineRepository machineRepository;
    private final @Lazy CommandService commandService;
    private final AlertEngineService alertEngineService;
    private final @Lazy MachineService machineService;

    // ----- Graph Traversal & Validation -----

    /** Check if adding this dependency creates a circular cycle */
    public boolean createsCycle(Long parentId, Long childId) {
        if (parentId.equals(childId)) return true;
        
        // Use BFS to see if parentId is reachable from childId (which would mean a cycle)
        Queue<Long> queue = new LinkedList<>();
        Set<Long> visited = new HashSet<>();
        
        queue.add(childId);
        visited.add(childId);
        
        while (!queue.isEmpty()) {
            Long current = queue.poll();
            if (current.equals(parentId)) return true;
            
            List<MachineDependency> downstream = dependencyRepository.findByParentMachineId(current);
            for (MachineDependency dep : downstream) {
                Long next = dep.getChildMachine().getId();
                if (!visited.contains(next)) {
                    visited.add(next);
                    queue.add(next);
                }
            }
        }
        return false;
    }

    /** Get all immediate child edge records */
    public List<MachineDependency> getDownstreamEdges(Machine parent) {
        return dependencyRepository.findByParentMachine(parent);
    }

    /** Get all immediate parent edge records */
    public List<MachineDependency> getUpstreamEdges(Machine child) {
        return dependencyRepository.findByChildMachine(child);
    }

    // ----- Command Handling & Propagation -----

    /** Returns true if all upstream parents are RUNNING (or CALIBRATING) */
    public boolean canStart(Long machineId) {
        Machine machine = machineRepository.findById(machineId).orElse(null);
        if (machine == null) return false;

        List<MachineDependency> upstream = getUpstreamEdges(machine);
        for (MachineDependency dep : upstream) {
            String parentStatus = dep.getParentMachine().getStatus();
            if (!"RUNNING".equals(parentStatus) && !"CALIBRATING".equals(parentStatus)) {
                return false;
            }
        }
        return true;
    }

    /** Find names of stopped required parent machines */
    public List<String> getStoppedParents(Long machineId) {
        Machine machine = machineRepository.findById(machineId).orElse(null);
        if (machine == null) return List.of();

        return getUpstreamEdges(machine).stream()
                .map(MachineDependency::getParentMachine)
                .filter(p -> !"RUNNING".equals(p.getStatus()) && !"CALIBRATING".equals(p.getStatus()))
                .map(Machine::getName)
                .collect(Collectors.toList());
    }

    /** Given a machine that just changed status, propagate to downstream */
    public void propagateCommand(Long sourceMachineId, String commandType, String issuedBy) {
        Machine source = machineRepository.findById(sourceMachineId).orElse(null);
        if (source == null) return;

        boolean isStop = "STOP".equals(commandType) || "MAINTENANCE_MODE".equals(commandType);
        boolean isEmergency = "EMERGENCY_STOP".equals(commandType);

        if (!isStop && !isEmergency) return; // Only propagate stops right now

        Queue<Machine> queue = new LinkedList<>();
        queue.add(source);
        
        // Track the reason why a machine was stopped
        Map<Long, Machine> stoppedByMap = new HashMap<>();

        while (!queue.isEmpty()) {
            Machine current = queue.poll();
            List<MachineDependency> edges = dependencyRepository.findByParentMachine(current);

            for (MachineDependency edge : edges) {
                Machine child = edge.getChildMachine();
                String currentChildStatus = child.getStatus();

                // Skip if already in the target stopped state to avoid infinite loops
                if ("STOPPED".equals(currentChildStatus) && isStop) continue;
                if ("EMERGENCY".equals(currentChildStatus) && isEmergency) continue;

                // Check edge propagation rules
                if (isStop && !edge.getPropagateStop()) continue;
                if (isEmergency && !edge.getPropagateEmergency()) continue;

                // It will be stopped. Issue command programmatically.
                // To avoid deep recursion issues, we directly call commandService here
                // We pass a special flag or reason via 'issuedBy' to denote dependency cascade
                String cascadeIssuer = "DEPENDENCY_CASCADE";
                
                // Track source for telemetry UI
                stoppedByMap.put(child.getId(), source);
                
                log.info("Cascading {} from {} to {}", commandType, current.getName(), child.getName());
                
                // Alert Engine hook
                Alert.AlertType alertType = isEmergency ? Alert.AlertType.DEPENDENCY_FAULT_CASCADE : Alert.AlertType.DEPENDENCY_STOP;
                Alert.AlertSeverity alertSeverity = isEmergency ? Alert.AlertSeverity.CRITICAL : Alert.AlertSeverity.MEDIUM;
                String msg = String.format("%s propagated from upstream %s (%s)", commandType, current.getName(), source.getName());
                alertEngineService.fireDependencyAlert(child, alertType, alertSeverity, msg);

                // Re-issue identical command
                commandService.issueCommand(child.getId(), commandType, "Automated Dependency Override", cascadeIssuer, true);

                queue.add(child);
            }
        }
        
        // We could store the stoppedByMap globally for the UI to display "Stopped due to X"
        // in machine telemetry if we want to be fancy.
    }

    // ----- Graph Visualization Helpers -----

    public DependencyGraphDTO getFullGraph() {
        List<Machine> machines = machineRepository.findAll();
        List<MachineDependency> deps = dependencyRepository.findAll();

        List<DependencyGraphDTO.NodeDTO> nodes = machines.stream()
                .map(m -> DependencyGraphDTO.NodeDTO.builder()
                        .id(m.getId())
                        .name(m.getName())
                        .type(m.getMachineType())
                        .status(m.getStatus())
                        .processUnit(m.getProcessUnit())
                        .build())
                .collect(Collectors.toList());

        List<DependencyGraphDTO.EdgeDTO> edges = deps.stream()
                .map(d -> DependencyGraphDTO.EdgeDTO.builder()
                        .id(d.getId())
                        .source(d.getParentMachine().getId())
                        .target(d.getChildMachine().getId())
                        .type(d.getDependencyType())
                        .propagateStop(d.getPropagateStop())
                        .build())
                .collect(Collectors.toList());

        return new DependencyGraphDTO(nodes, edges);
    }

    @Transactional
    public DependencyEdgeDTO createDependency(Long parentId, Long childId, String type, boolean propStop, boolean propEmerg) {
        if (createsCycle(parentId, childId)) {
            throw new IllegalArgumentException("Cannot create dependency: Circular reference detected.");
        }

        Machine parent = machineRepository.findById(parentId).orElseThrow();
        Machine child = machineRepository.findById(childId).orElseThrow();

        if (dependencyRepository.existsByParentMachineAndChildMachine(parent, child)) {
            throw new IllegalArgumentException("Dependency already exists.");
        }

        MachineDependency dep = MachineDependency.builder()
                .parentMachine(parent)
                .childMachine(child)
                .dependencyType(type != null ? type : "PROCESS_FLOW")
                .propagateStop(propStop)
                .propagateEmergency(propEmerg)
                .build();

        dependencyRepository.save(dep);

        return mapToDTO(dep);
    }
    
    @Transactional
    public void deleteDependency(Long id) {
        dependencyRepository.deleteById(id);
    }

    private DependencyEdgeDTO mapToDTO(MachineDependency d) {
        return DependencyEdgeDTO.builder()
                .id(d.getId())
                .parentMachineId(d.getParentMachine().getId())
                .parentMachineName(d.getParentMachine().getName())
                .childMachineId(d.getChildMachine().getId())
                .childMachineName(d.getChildMachine().getName())
                .dependencyType(d.getDependencyType())
                .propagateStop(d.getPropagateStop())
                .propagateEmergency(d.getPropagateEmergency())
                .build();
    }
}
