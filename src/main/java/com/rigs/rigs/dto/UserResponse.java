package com.rigs.rigs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private Integer enabled;
    private String provider;
    private String profileImageUrl;
    private Boolean twoFactorEnabled;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
