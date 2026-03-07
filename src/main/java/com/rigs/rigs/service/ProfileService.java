package com.rigs.rigs.service;

import com.rigs.rigs.entity.LoginHistory;
import com.rigs.rigs.entity.User;
import com.rigs.rigs.entity.UserSession;
import com.rigs.rigs.repository.LoginHistoryRepository;
import com.rigs.rigs.repository.UserRepository;
import com.rigs.rigs.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()\\-_=+])[A-Za-z\\d@$!%*?&#^()\\-_=+]{8,}$");

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${rigs.upload.dir:./uploads}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public User getProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    @Transactional
    public void updateName(String email, String newName) {
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }

        User user = getProfile(email);
        user.setName(newName.trim());
        userRepository.save(user);
        log.info("User {} updated name to: {}", email, newName.trim());
    }

    @Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = getProfile(email);

        if (user.getPassword() == null || !passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        validatePasswordStrength(newPassword);

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("User {} changed password", email);
    }

    public void validatePasswordStrength(String password) {
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special character");
        }
    }

    @Transactional
    public String uploadProfileImage(String email, MultipartFile file) throws IOException {
        if (file.isEmpty())
            throw new IllegalArgumentException("File is empty");

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be less than 5MB");
        }

        Path profilesDir = Paths.get(uploadDir, "profiles");
        Files.createDirectories(profilesDir);

        String originalFilename = file.getOriginalFilename();
        String extension = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String filename = UUID.randomUUID() + extension;

        Path targetPath = profilesDir.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String imageUrl = "/uploads/profiles/" + filename;
        User user = getProfile(email);
        user.setProfileImageUrl(imageUrl);
        userRepository.save(user);

        log.info("User {} uploaded profile image: {}", email, filename);
        return imageUrl;
    }

    @Transactional
    public void toggleTwoFactor(String email) {
        User user = getProfile(email);
        boolean newState = !Boolean.TRUE.equals(user.getTwoFactorEnabled());
        user.setTwoFactorEnabled(newState);
        userRepository.save(user);
        log.info("User {} toggled 2FA to: {}", email, newState);
    }

    @Transactional(readOnly = true)
    public List<LoginHistory> getLoginHistory(String email) {
        User user = getProfile(email);
        return loginHistoryRepository.findByUserOrderByLoginTimeDesc(user);
    }

    @Transactional(readOnly = true)
    public List<UserSession> getActiveSessions(String email) {
        User user = getProfile(email);
        return userSessionRepository.findByUserAndActiveTrue(user);
    }

    @Transactional
    public void recordLoginAttempt(User user, String ipAddress, String userAgent, boolean success) {
        LoginHistory history = LoginHistory.builder()
                .user(user)
                .loginTime(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .success(success)
                .build();
        loginHistoryRepository.save(history);

        if (success) {
            user.setFailedAttempts(0);
            user.setLastLoginAt(LocalDateTime.now());
            user.setLastLoginIp(ipAddress);
            userRepository.save(user);
        } else {
            int attempts = (user.getFailedAttempts() != null ? user.getFailedAttempts() : 0) + 1;
            user.setFailedAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setAccountLocked(true);
                log.warn("Account locked for user {} after {} failed attempts", user.getEmail(), attempts);
            }
            userRepository.save(user);
        }
    }

    @Transactional
    public UserSession createSession(User user, String ipAddress, String userAgent) {
        UserSession session = UserSession.builder()
                .user(user)
                .sessionToken(UUID.randomUUID().toString())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .createdAt(LocalDateTime.now())
                .lastAccessedAt(LocalDateTime.now())
                .active(true)
                .build();
        return userSessionRepository.save(session);
    }
}
