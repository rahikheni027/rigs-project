//package com.rigs.rigs.repository;
//
//import com.rigs.rigs.model.User;
//import org.springframework.data.jpa.repository.JpaRepository;
//
//public interface UserRepository extends JpaRepository<User, Long> {
//    User findByEmail(String email);
//}
package com.rigs.rigs.repository;

import com.rigs.rigs.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByEnabled(Integer enabled);
}
