package com.rigs.rigs.repository;

import com.rigs.rigs.entity.Alert;
import com.rigs.rigs.entity.Machine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    Page<Alert> findByAcknowledged(Boolean acknowledged, Pageable pageable);

    Optional<Alert> findFirstByMachineAndTypeAndAcknowledgedFalse(Machine machine, Alert.AlertType type);
}
