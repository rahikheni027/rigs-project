package com.rigs.rigs.controller;

import com.rigs.rigs.dto.MachineSettingsDTO;
import com.rigs.rigs.service.MachineSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class MachineSettingsController {

    private final MachineSettingsService settingsService;

    @GetMapping
    public ResponseEntity<List<MachineSettingsDTO>> getAllSettings() {
        return ResponseEntity.ok(settingsService.getAllSettings());
    }

    @PutMapping("/{machineId}")
    public ResponseEntity<?> updateSettings(
            @PathVariable Long machineId,
            @RequestBody MachineSettingsDTO settingsDTO,
            HttpServletRequest request) {

        String email = getCurrentUserEmail();
        String ipAddress = getClientIpAddress(request);

        settingsService.updateSettings(machineId, settingsDTO.getVibrationThreshold(),
                settingsDTO.getRuntimeLimitHours(), settingsDTO.getHeartbeatTimeout(), email, ipAddress);

        return ResponseEntity.ok(Map.of("message", "Settings updated successfully"));
    }

    private String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "SYSTEM";
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        return xf != null ? xf.split(",")[0].trim() : request.getRemoteAddr();
    }
}
