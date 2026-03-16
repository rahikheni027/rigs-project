package com.rigs.rigs.repository;

import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.entity.MachineTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineTelemetryRepository extends JpaRepository<MachineTelemetry, Long> {
    Optional<MachineTelemetry> findFirstByMachineOrderByTimestampDesc(Machine machine);

    List<MachineTelemetry> findTop50ByMachineOrderByTimestampDesc(Machine machine);
}
