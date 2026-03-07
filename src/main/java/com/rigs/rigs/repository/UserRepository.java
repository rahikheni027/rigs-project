package com.rigs.rigs.repository;

import com.rigs.rigs.entity .User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByEnabled(Integer enabled);

    List<User> findByRole(String role);

    List<User> findByRoleNot(String role);

    List<User> findByEnabledAndRoleNot(Integer enabled, String role);
}
