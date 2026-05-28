package com.aurafit.repository;

import com.aurafit.entity.CostumeSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CostumeSetRepository extends JpaRepository<CostumeSet, Long> {
}
