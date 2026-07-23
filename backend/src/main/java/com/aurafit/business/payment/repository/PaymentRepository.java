package com.aurafit.business.payment.repository;

import com.aurafit.business.payment.entity.Payment;
import com.aurafit.business.payment.enums.PaymentStatus;
import com.aurafit.business.payment.enums.PaymentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByRentalOrderIdAndStatusAndType(
            Long orderId,
            PaymentStatus status,
            PaymentType type
    );

    Optional<Payment> findFirstByTransactionId(String transactionId);

    Optional<Payment> findByRentalOrderIdAndType(
            Long orderId,
            PaymentType type
    );

    @Query("""
            SELECT COALESCE(SUM(p.amount), 0)
            FROM Payment p
            WHERE p.type = :type AND p.status = :status
            """)
    BigDecimal calculateTotalAmountByTypeAndStatus(
            @Param("type") PaymentType type,
            @Param("status") PaymentStatus status
    );

    @Query(value = """
            SELECT p
            FROM Payment p
            JOIN FETCH p.rentalOrder ro
            JOIN FETCH ro.user u
            WHERE p.type = :type
              AND p.status = :status
              AND p.updatedAt >= :startDate
              AND p.updatedAt <= :endDate
              AND (
                    LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(COALESCE(p.transactionId, '')) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR CAST(ro.id AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
              )
            """,
            countQuery = """
            SELECT COUNT(p)
            FROM Payment p
            JOIN p.rentalOrder ro
            JOIN ro.user u
            WHERE p.type = :type
              AND p.status = :status
              AND p.updatedAt >= :startDate
              AND p.updatedAt <= :endDate
              AND (
                    LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(COALESCE(p.transactionId, '')) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR CAST(ro.id AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
              )
            """)
    Page<Payment> findRevenueTransactions(
            @Param("type") PaymentType type,
            @Param("status") PaymentStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query(value = """
            SELECT TO_CHAR(updated_at, 'YYYY-MM-DD') AS date,
                   COALESCE(SUM(amount), 0) AS daily_revenue
            FROM payments
            WHERE updated_at >= :startDate
              AND updated_at <= :endDate
              AND type = 'PAYMENT'
              AND status = 'PAID'
            GROUP BY TO_CHAR(updated_at, 'YYYY-MM-DD')
            ORDER BY TO_CHAR(updated_at, 'YYYY-MM-DD') ASC
            """, nativeQuery = true)
    java.util.List<Object[]> getDailyPaidRevenue(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
