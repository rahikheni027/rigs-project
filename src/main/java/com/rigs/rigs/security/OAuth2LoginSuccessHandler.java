package com.rigs.rigs.security;

import com.rigs.rigs.entity.User;
import com.rigs.rigs.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;

@Component
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

        private final UserRepository userRepository;
        private final JwtUtils jwtUtils;

        @Value("${rigs.frontend.url:http://localhost:5173}")
        private String frontendUrl;

        public OAuth2LoginSuccessHandler(UserRepository userRepository, JwtUtils jwtUtils) {
                this.userRepository = userRepository;
                this.jwtUtils = jwtUtils;
        }

        @Override
        public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                        Authentication authentication) throws IOException, ServletException {

                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                String email = oAuth2User.getAttribute("email");
                String name = oAuth2User.getAttribute("name");
                String picture = oAuth2User.getAttribute("picture");

                log.info("OAuth2 login for: {}", email);

                User user = userRepository.findByEmail(email).orElse(null);

                if (user == null) {
                        // New user — create with pending approval
                        user = User.builder()
                                        .name(name)
                                        .email(email)
                                        .provider("GOOGLE")
                                        .profileImageUrl(picture)
                                        .role("WORKER")
                                        .enabled(0) // pending admin approval
                                        .active(1)
                                        .accountLocked(false)
                                        .failedAttempts(0)
                                        .twoFactorEnabled(false)
                                        .createdAt(LocalDateTime.now())
                                        .build();
                        userRepository.save(user);
                        log.info("Created new Google user (pending approval): {}", email);

                        // Redirect to frontend with pending message
                        getRedirectStrategy().sendRedirect(request, response,
                                        frontendUrl + "/login?oauth=pending");
                        return;
                }

                if (user.getEnabled() == 0) {
                        // Existing but not approved yet
                        getRedirectStrategy().sendRedirect(request, response,
                                        frontendUrl + "/login?oauth=pending");
                        return;
                }

                if (user.getAccountLocked() != null && user.getAccountLocked()) {
                        getRedirectStrategy().sendRedirect(request, response,
                                        frontendUrl + "/login?oauth=locked");
                        return;
                }

                // User is approved — generate JWT
                org.springframework.security.core.userdetails.User springUser = new org.springframework.security.core.userdetails.User(
                                user.getEmail(),
                                "",
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole())));

                org.springframework.security.authentication.UsernamePasswordAuthenticationToken authToken = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                springUser, null, springUser.getAuthorities());

                String jwt = jwtUtils.generateJwtToken(authToken);

                // Update last login
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);

                log.info("✅ OAuth2 login successful for: {}", email);

                request.getSession().setAttribute("oauthToken", jwt);
                request.getSession().setAttribute("oauthName", user.getName());
                request.getSession().setAttribute("oauthEmail", user.getEmail());
                request.getSession().setAttribute("oauthRole", user.getRole());
                request.getSession().setAttribute("oauthId", user.getId().toString());

                getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/oauth/callback");
        }
}
