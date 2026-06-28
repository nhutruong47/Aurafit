package com.aurafit.repository;

import com.aurafit.entity.User;
import com.aurafit.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findAllByOrderByIdDesc();

    List<User> findByRoleOrderByIdAsc(Role role);

    boolean existsByEmail(String email);

    boolean existsByEmailAndEmailVerifiedTrue(String email);
}
