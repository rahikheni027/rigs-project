package com.rigs.rigs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "commands")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Command {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(name = "command_type", nullable = false)
    private String commandType;

    @Column(columnDefinition = "TEXT")
    private String parameters;

    @Column(name = "issued_by")
    private String issuedBy;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Builder.Default
    private String status = "PENDING";

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "response_payload", columnDefinition = "TEXT")
    private String responsePayload;

    @PrePersist
    protected void onCreate() {
        if (issuedAt == null) {
            issuedAt = LocalDateTime.now();
        }
    }
}
