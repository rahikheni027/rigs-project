package com.rigs.rigs.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                // 🔴 TEMPORARILY ALLOW ALL PAGES
                // Access control is handled in controllers
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )

                // Google OAuth still works
                .oauth2Login(oauth -> oauth
                        .loginPage("/")
                        .defaultSuccessUrl("/oauth-success", true)
                )

                .logout(logout -> logout
                        .logoutSuccessUrl("/")
                );

        return http.build();
    }
}

