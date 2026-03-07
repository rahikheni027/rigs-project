package com.rigs.rigs.repository;

import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.entity.MachineSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MachineSettingsRepository extends JpaRepository<MachineSettings, Long> {
    Optional<MachineSettings> findByMachine(Machine machine);
}
