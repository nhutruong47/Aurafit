package com.aurafit.repository;

import com.aurafit.entity.UserPreferenceProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPreferenceProfileRepository extends JpaRepository<UserPreferenceProfile, Long> {

    Optional<UserPreferenceProfile> findByUserId(Long userId);
}
