package com.aurafit.repository;

import com.aurafit.entity.Payment;
import com.aurafit.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByRentalOrderIdAndStatusAndType(
            Long orderId,
            PaymentStatus status,
            com.aurafit.enums.PaymentType type
    );

    Optional<Payment> findFirstByTransactionId(String transactionId);

    Optional<Payment> findByRentalOrderIdAndType(
            Long orderId,
            com.aurafit.enums.PaymentType type
    );
}
