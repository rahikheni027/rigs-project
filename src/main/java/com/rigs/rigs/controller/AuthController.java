package com.rigs.rigs.controller;

import com.rigs.rigs.dto.*;
import com.rigs.rigs.entity.User;
import com.rigs.rigs.repository.UserRepository;
import com.rigs.rigs.security.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    private final ConcurrentHashMap<String, Long> requestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> timeWindows = new ConcurrentHashMap<>();

    private boolean isRateLimited(String ip) {
        long now = System.currentTimeMillis();
        long windowStart = timeWindows.computeIfAbsent(ip, k -> now);
        
        if (now - windowStart > 60000) { // 1 minute window
            timeWindows.put(ip, now);
            requestCounts.put(ip, 1L);
            return false;
        }
        long count = requestCounts.getOrDefault(ip, 0L);
        if (count >= 5) return true;
        
        requestCounts.put(ip, count + 1);
        return false;
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        if (isRateLimited(request.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "TOO_MANY_REQUESTS", "message", "Rate limit exceeded. Try again in 1 minute."));
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

            // Update last login time
            user.setLastLoginAt(java.time.LocalDateTime.now());
            userRepository.save(user);

            return ResponseEntity.ok(JwtResponse.builder()
                    .token(jwt)
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .roles(roles)
                    .build());

        } catch (DisabledException e) {
            log.warn("Login attempt by disabled/pending account: {}", loginRequest.getEmail());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error", "ACCOUNT_PENDING",
                            "message",
                            "Your account is pending admin approval. Please wait for the administrator to approve your access."));
        } catch (LockedException e) {
            log.warn("Login attempt by locked account: {}", loginRequest.getEmail());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error", "ACCOUNT_LOCKED",
                            "message", "Your account has been locked. Please contact the administrator."));
        } catch (AuthenticationException e) {
            log.warn("Failed login attempt for: {}", loginRequest.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "BAD_CREDENTIALS",
                            "message", "Invalid email or password. Please try again."));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest, HttpServletRequest request) {
        if (isRateLimited(request.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "TOO_MANY_REQUESTS", "message", "Rate limit exceeded. Try again in 1 minute."));
        }
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = User.builder()
                .name(signUpRequest.getName())
                .email(signUpRequest.getEmail())
                .password(passwordEncoder.encode(signUpRequest.getPassword()))
                .role("WORKER")
                .provider("LOCAL")
                .enabled(0) // Pending approval
                .active(1)
                .build();

        userRepository.save(user);
        log.info("Registered new user: {} (pending approval)", user.getEmail());

        return ResponseEntity.ok(new MessageResponse(
                "User registered successfully! Your account is pending admin approval. You will be able to login once an administrator approves your access."));
    }

    @GetMapping("/oauth2/success")
    public ResponseEntity<?> getOAuth2Token(HttpServletRequest request) {
        String token = (String) request.getSession().getAttribute("oauthToken");
        if (token != null) {
            Map<String, Object> data = Map.of(
                    "token", token,
                    "name", request.getSession().getAttribute("oauthName"),
                    "email", request.getSession().getAttribute("oauthEmail"),
                    "roles", List.of("ROLE_" + request.getSession().getAttribute("oauthRole")),
                    "id", request.getSession().getAttribute("oauthId")
            );
            request.getSession().invalidate();
            return ResponseEntity.ok(data);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
