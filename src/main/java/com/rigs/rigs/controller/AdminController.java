package com.rigs.rigs.controller;

import com.rigs.rigs.dto.MessageResponse;
import com.rigs.rigs.dto.UserResponse;
import com.rigs.rigs.entity.User;
import com.rigs.rigs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findByRoleNot("ADMIN").stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/pending")
    public ResponseEntity<List<UserResponse>> getPendingUsers() {
        List<UserResponse> users = userRepository.findByEnabledAndRoleNot(0, "ADMIN").stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot modify admin user"));
        }

        user.setEnabled(1);
        userRepository.save(user);
        log.info("✅ Approved user: {}", user.getEmail());
        return ResponseEntity.ok(new MessageResponse("User approved successfully"));
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot modify admin user"));
        }

        userRepository.delete(user);
        log.info("❌ Rejected user: {}", user.getEmail());
        return ResponseEntity.ok(new MessageResponse("User rejected and removed"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> removeUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot delete admin user"));
        }

        userRepository.delete(user);
        log.info("🗑️ Removed user: {}", user.getEmail());
        return ResponseEntity.ok(new MessageResponse("User removed successfully"));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalWorkers = userRepository.findByRoleNot("ADMIN").size();
        long pendingApproval = userRepository.findByEnabledAndRoleNot(0, "ADMIN").size();
        long activeWorkers = userRepository.findByEnabledAndRoleNot(1, "ADMIN").size();

        return ResponseEntity.ok(java.util.Map.of(
                "totalWorkers", totalWorkers,
                "pendingApproval", pendingApproval,
                "activeWorkers", activeWorkers));
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
