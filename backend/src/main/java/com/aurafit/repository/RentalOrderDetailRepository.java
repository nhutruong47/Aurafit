package com.aurafit.repository;

import com.aurafit.entity.RentalOrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalOrderDetailRepository extends JpaRepository<RentalOrderDetail, Long> {

    List<RentalOrderDetail> findByRentalOrderId(Long rentalOrderId);
}
