package com.rigs.rigs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "machine_telemetry")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineTelemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(nullable = false)
    private Double temperature;

    @Column(nullable = false)
    private Double vibration;

    @Column(nullable = false)
    private Double currentDraw;

    @Column(nullable = false)
    private String machineStatus;

    private Double rpm;

    private Double pressure;

    @Column(name = "power_consumption")
    private Double powerConsumption;

    private Double efficiency;

    @Column(name = "error_rate")
    private Double errorRate;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
