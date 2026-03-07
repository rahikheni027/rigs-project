package com.rigs.rigs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "machine_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false, unique = true)
    private Machine machine;

    @Builder.Default
    @Column(name = "heartbeat_timeout")
    private Long heartbeatTimeout = 60L;

    @Builder.Default
    @Column(name = "vibration_threshold")
    private Double vibrationThreshold = 2.5;

    @Builder.Default
    @Column(name = "runtime_limit_hours")
    private Double runtimeLimitHours = 5000.0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
