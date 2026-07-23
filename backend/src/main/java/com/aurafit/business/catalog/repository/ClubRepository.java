package com.aurafit.business.catalog.repository;

import com.aurafit.business.catalog.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long>, JpaSpecificationExecutor<Club> {

    Optional<Club> findByName(String name);

    boolean existsByName(String name);
}
