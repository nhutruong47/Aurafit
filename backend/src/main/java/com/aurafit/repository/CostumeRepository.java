package com.aurafit.repository;

import com.aurafit.entity.Costume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CostumeRepository extends JpaRepository<Costume, Long> {
}
