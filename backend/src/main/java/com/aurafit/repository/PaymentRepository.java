package com.aurafit.repository;

import com.aurafit.entity.Payment;
import com.aurafit.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("""
            SELECT p FROM Payment p
            WHERE p.rentalOrder.id = :orderId
              AND p.status = :status
              AND p.type = :type
            """)
    Optional<Payment> findByRentalOrderIdAndStatusAndType(
            @Param("orderId") Long orderId,
            @Param("status") PaymentStatus status,
            @Param("type") com.aurafit.enums.PaymentType type
    );

    Optional<Payment> findFirstByTransactionId(String transactionId);
}
