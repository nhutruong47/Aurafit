package com.aurafit.repository;

import com.aurafit.entity.RentalOrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RentalOrderDetailRepository extends JpaRepository<RentalOrderDetail, Long> {

    @Query("SELECT rd FROM RentalOrderDetail rd WHERE rd.rentalOrder.id = :orderId")
    List<RentalOrderDetail> findByRentalOrderId(@Param("orderId") Long orderId);
}
