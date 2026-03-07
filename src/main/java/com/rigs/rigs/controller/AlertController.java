package com.rigs.rigs.controller;

import com.rigs.rigs.dto.AlertResponse;
import com.rigs.rigs.entity.Alert;
import com.rigs.rigs.entity.User;
import com.rigs.rigs.repository.UserRepository;
import com.rigs.rigs.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Slf4j
public class AlertController {

    private final AlertService alertService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<AlertResponse>> getAlerts(
            @RequestParam(required = false) Boolean acknowledged,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Alert> alerts = alertService.getAlerts(acknowledged, pageRequest);

        Page<AlertResponse> response = alerts.map(alert -> com.rigs.rigs.dto.AlertResponse.builder()
                .id(alert.getId())
                .machineId(alert.getMachine().getId())
                .machineName(alert.getMachine().getName())
                .type(alert.getType().name())
                .severity(alert.getSeverity().name())
                .message(alert.getMessage())
                .createdAt(alert.getCreatedAt())
                .acknowledged(alert.getAcknowledged())
                .acknowledgedBy(alert.getAcknowledgedBy() != null ? alert.getAcknowledgedBy().getEmail() : null)
                .build());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{alertId}/acknowledge")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> acknowledgeAlert(@PathVariable Long alertId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        alertService.acknowledgeAlert(alertId, user);
        return ResponseEntity.ok(Map.of("message", "Alert acknowledged successfully"));
    }
}
