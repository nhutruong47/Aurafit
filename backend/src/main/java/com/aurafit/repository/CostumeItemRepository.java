package com.aurafit.repository;

import com.aurafit.entity.CostumeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CostumeItemRepository extends JpaRepository<CostumeItem, Long> {
}
