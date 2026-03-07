package com.rigs.rigs.service;

import com.rigs.rigs.entity.AuditLog;
import com.rigs.rigs.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(String userEmail, String action, String resource, String details,
            String ipAddress, String severity, Long machineId) {
        AuditLog logEntry = AuditLog.builder()
                .timestamp(LocalDateTime.now())
                .userEmail(userEmail)
                .action(action)
                .resource(resource)
                .details(details)
                .ipAddress(ipAddress)
                .severity(severity)
                .machineId(machineId)
                .build();

        auditLogRepository.save(logEntry);
        log.debug("AuditLog: {} - {} by {}", severity, action, userEmail);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
}
