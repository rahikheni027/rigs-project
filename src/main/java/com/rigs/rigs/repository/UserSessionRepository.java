package com.rigs.rigs.repository;

import com.rigs.rigs.entity.User;
import com.rigs.rigs.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    Optional<UserSession> findBySessionToken(String sessionToken);

    List<UserSession> findByUserAndActiveTrue(User user);

    void deleteBySessionToken(String sessionToken);
}
