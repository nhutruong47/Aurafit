package com.aurafit.repository;

import com.aurafit.entity.User;
import com.aurafit.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    long countByRole(com.aurafit.enums.Role role);

    org.springframework.data.domain.Page<User> findAll(org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<User> findByRole(Role role, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) OR " +
            "LOWER(u.phone) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))")
    org.springframework.data.domain.Page<User> searchUsers(@org.springframework.data.repository.query.Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.role = :role AND (" +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) OR " +
            "LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))" )
    org.springframework.data.domain.Page<User> searchUsersByRole(
            @org.springframework.data.repository.query.Param("role") Role role,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            org.springframework.data.domain.Pageable pageable
    );

    List<User> findAllByOrderByIdDesc();

    List<User> findByRoleOrderByIdAsc(Role role);

    boolean existsByEmail(String email);

    boolean existsByEmailAndEmailVerifiedTrue(String email);
}
