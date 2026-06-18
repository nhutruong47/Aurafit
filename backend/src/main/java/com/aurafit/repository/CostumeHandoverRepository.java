package com.aurafit.repository;

import com.aurafit.entity.CostumeHandover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CostumeHandoverRepository extends JpaRepository<CostumeHandover, Long> {

    List<CostumeHandover> findByRentalOrderIdOrderByCreatedAtDesc(Long rentalOrderId);
}
