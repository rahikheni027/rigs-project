package com.rigs.rigs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "machine_dependencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_machine_id", nullable = false)
    private Machine parentMachine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_machine_id", nullable = false)
    private Machine childMachine;

    @Column(name = "dependency_type")
    @Builder.Default
    private String dependencyType = "PROCESS_FLOW";

    @Column(name = "propagate_stop")
    @Builder.Default
    private Boolean propagateStop = true;

    @Column(name = "propagate_emergency")
    @Builder.Default
    private Boolean propagateEmergency = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
