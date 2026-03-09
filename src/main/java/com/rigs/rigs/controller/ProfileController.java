package com.rigs.rigs.controller;

import com.rigs.rigs.dto.UserResponse;
import com.rigs.rigs.dto.MessageResponse;
import com.rigs.rigs.entity.User;
import com.rigs.rigs.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = profileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImageUrl(user.getProfileImageUrl())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build());
    }

    @PutMapping("/update-name")
    public ResponseEntity<?> updateName(@AuthenticationPrincipal UserDetails userDetails, @RequestParam String name) {
        profileService.updateName(userDetails.getUsername(), name);
        return ResponseEntity.ok(new MessageResponse("Name updated successfully"));
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
        String imageUrl = profileService.uploadProfileImage(userDetails.getUsername(), file);
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }

    @PostMapping("/toggle-2fa")
    public ResponseEntity<?> toggle2fa(@AuthenticationPrincipal UserDetails userDetails) {
        profileService.toggleTwoFactor(userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("2FA setting updated"));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(new MessageResponse("New password must be at least 6 characters"));
        }

        try {
            profileService.changePassword(userDetails.getUsername(), currentPassword, newPassword);
            return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
