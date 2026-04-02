package com.rigs.rigs.repository;

import com.rigs.rigs.entity.Machine;
import com.rigs.rigs.entity.MachineDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MachineDependencyRepository extends JpaRepository<MachineDependency, Long> {

    /** Find all downstream dependents (children) of a given parent machine */
    List<MachineDependency> findByParentMachine(Machine parentMachine);

    /** Find all upstream parents of a given child machine */
    List<MachineDependency> findByChildMachine(Machine childMachine);

    /** Check if a specific parent→child edge already exists */
    boolean existsByParentMachineAndChildMachine(Machine parentMachine, Machine childMachine);

    /** Find edges by parent machine id */
    List<MachineDependency> findByParentMachineId(Long parentMachineId);

    /** Find edges by child machine id */
    List<MachineDependency> findByChildMachineId(Long childMachineId);
}
