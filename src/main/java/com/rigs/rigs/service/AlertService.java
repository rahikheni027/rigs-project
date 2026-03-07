package com.rigs.rigs.service;

import com.rigs.rigs.entity.Alert;
import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.entity.User;
import com.rigs.rigs.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;

    @Transactional
    public void createAlert(Machine machine, Alert.AlertType type, Alert.AlertSeverity severity, String message) {
        // Prevent duplicate active alerts for same machine/type
        Optional<Alert> existing = alertRepository.findFirstByMachineAndTypeAndAcknowledgedFalse(machine, type);
        if (existing.isPresent()) {
            return;
        }

        Alert alert = Alert.builder()
                .machine(machine)
                .type(type)
                .severity(severity)
                .message(message)
                .createdAt(LocalDateTime.now())
                .acknowledged(false)
                .build();

        alertRepository.save(alert);
        log.info("📢 New Alert generated: {} for Machine {}", type, machine.getId());
    }

    @Transactional
    public void acknowledgeAlert(Long alertId, User user) {
        alertRepository.findById(alertId).ifPresent(alert -> {
            alert.setAcknowledged(true);
            alert.setAcknowledgedBy(user);
            alertRepository.save(alert);
            log.info("✅ Alert {} acknowledged by {}", alertId, user.getEmail());
        });
    }

    @Transactional(readOnly = true)
    public Page<Alert> getAlerts(Boolean acknowledged, Pageable pageable) {
        if (acknowledged != null) {
            return alertRepository.findByAcknowledged(acknowledged, pageable);
        }
        return alertRepository.findAll(pageable);
    }
}
