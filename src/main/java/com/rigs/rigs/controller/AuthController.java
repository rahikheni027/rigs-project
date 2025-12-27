package com.rigs.rigs.controller;

import com.rigs.rigs.model.User;
import com.rigs.rigs.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@Controller
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ================= LOGIN PAGE =================
    @GetMapping("/")
    public String loginPage() {
        return "login";
    }

    // ================= REGISTER PAGE (OPTIONAL / ADMIN USE ONLY) =================
    @GetMapping("/register")
    public String registerPage() {
        return "register";
    }

    // ================= REGISTER (OPTIONAL – NOT FOR WORKERS) =================
    @PostMapping("/register")
    public String registerUser(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String password,
            Model model
    ) {

        if (userRepository.findByEmail(email) != null) {
            model.addAttribute("error", "Email already exists");
            return "register";
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setProvider("LOCAL");
        user.setRole("WORKER");
        user.setActive(1);
        user.setEnabled(0); // admin approval required

        userRepository.save(user);

        model.addAttribute("error", "Registered. Wait for admin approval.");
        return "login";
    }

    // ================= LOGIN =================
    @PostMapping("/login")
    public String loginUser(
            @RequestParam String email,
            @RequestParam String password,
            Model model
    ) {

//        User user = userRepository.findByEmail(email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (user == null) {
            model.addAttribute("error", "Invalid credentials");
            return "login";
        }

        if (!user.getRole().equals("ADMIN") && !user.getRole().equals("WORKER")) {
            model.addAttribute("error", "Access denied");
            return "login";
        }

        if (user.getRole().equals("WORKER") && user.getEnabled() == 0) {
            model.addAttribute("error", "Waiting for admin approval");
            return "login";
        }

        if ("LOCAL".equals(user.getProvider())
                && !passwordEncoder.matches(password, user.getPassword())) {
            model.addAttribute("error", "Invalid credentials");
            return "login";
        }

        model.addAttribute("name", user.getName());
        model.addAttribute("role", user.getRole());

        if (user.getRole().equals("ADMIN")) {
            return "redirect:/admin/dashboard";
        } else {
            return "dashboard";
        }
    }

    // ================= GOOGLE LOGIN (WORKER) =================
    @GetMapping("/oauth-success")
    public String oauthSuccess(
            @AuthenticationPrincipal OAuth2User oauthUser,
            Model model
    ) {

        if (oauthUser == null) {
            return "redirect:/";
        }

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

//        User user = userRepository.findByEmail(email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user== null) {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setRole("PENDING");
            user.setActive(0);
            user.setProvider("GOOGLE");
            user.setPassword("OAUTH");
            userRepository.save(user);
            model.addAttribute("error", "Access denied. Contact admin.");
            return "login";
        }

        if (user.getEnabled() == 0) {
            model.addAttribute("error", "Waiting for admin approval");
            return "login";
        }

        user.setProvider("GOOGLE");
        userRepository.save(user);

        model.addAttribute("name", user.getName());
        model.addAttribute("role", user.getRole());
        return "dashboard";
    }

    // ================= ADMIN DASHBOARD =================
    @GetMapping("/admin/dashboard")
    public String adminDashboard(Model model) {

        model.addAttribute("workers",
                userRepository.findAll()
                        .stream()
                        .filter(u -> "WORKER".equals(u.getRole()))
                        .collect(Collectors.toList())
        );

        return "admin-dashboard";
    }

    // ================= ADMIN CREATE WORKER =================
    @PostMapping("/admin/create-worker")
    public String createWorker(
            @RequestParam String name,
            @RequestParam String email
    ) {

        if (userRepository.findByEmail(email) != null) {
            return "redirect:/admin/dashboard";
        }

        User worker = new User();
        worker.setName(name);
        worker.setEmail(email);
        worker.setRole("WORKER");
        worker.setProvider("LOCAL");
        worker.setEnabled(0);
        worker.setActive(1);
        worker.setPassword(null);

        userRepository.save(worker);

        return "redirect:/admin/dashboard";
    }

    // ================= ADMIN APPROVE WORKER =================
    @PostMapping("/admin/approve-worker")
    public String approveWorker(@RequestParam Long userId) {

        User worker = userRepository.findById(userId).orElse(null);

        if (worker != null && "WORKER".equals(worker.getRole())) {
            worker.setEnabled(1);
            userRepository.save(worker);
        }

        return "redirect:/admin/dashboard";
    }

    // ================= LOGOUT =================
    @GetMapping("/logout")
    public String logout() {
        return "redirect:/";
    }
}
