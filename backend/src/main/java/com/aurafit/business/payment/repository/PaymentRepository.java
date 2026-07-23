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
import java.util.List;
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

    @Query(value = """
            SELECT COALESCE(SUM(
                GREATEST(
                    p.amount - COALESCE((
                        SELECT SUM(related_ro.total_deposit)
                        FROM rental_orders related_ro
                        WHERE related_ro.id = payment_ro.id
                           OR (
                                payment_ro.session_id IS NOT NULL
                                AND related_ro.session_id = payment_ro.session_id
                           )
                    ), 0),
                    0
                ) + COALESCE((
                    SELECT SUM(
                        CASE
                            WHEN related_ro.status = 'COMPLETED' THEN
                                LEAST(
                                    GREATEST(COALESCE(related_ro.total_deposit, 0), 0),
                                    GREATEST(
                                        COALESCE(related_ro.total_late_fee, 0)
                                        + COALESCE(related_ro.total_damage_fee, 0),
                                        0
                                    )
                                )
                            ELSE 0
                        END
                    )
                    FROM rental_orders related_ro
                    WHERE related_ro.id = payment_ro.id
                       OR (
                            payment_ro.session_id IS NOT NULL
                            AND related_ro.session_id = payment_ro.session_id
                       )
                ), 0)
            ), 0)
            FROM payments p
            JOIN rental_orders payment_ro ON payment_ro.id = p.rental_order_id
            WHERE p.type = 'PAYMENT'
              AND p.status = 'PAID'
            """, nativeQuery = true)
    BigDecimal calculateTotalPaidRevenueExcludingDeposits();

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
            SELECT p.id,
                   COALESCE(SUM(related_ro.total_deposit), 0),
                   COALESCE(SUM(
                       CASE
                           WHEN related_ro.status = 'COMPLETED' THEN
                               LEAST(
                                   GREATEST(COALESCE(related_ro.total_deposit, 0), 0),
                                   GREATEST(
                                       COALESCE(related_ro.total_late_fee, 0)
                                       + COALESCE(related_ro.total_damage_fee, 0),
                                       0
                                   )
                               )
                           ELSE 0
                       END
                   ), 0)
            FROM payments p
            JOIN rental_orders payment_ro ON payment_ro.id = p.rental_order_id
            JOIN rental_orders related_ro
              ON related_ro.id = payment_ro.id
              OR (
                   payment_ro.session_id IS NOT NULL
                   AND related_ro.session_id = payment_ro.session_id
              )
            WHERE p.id IN (:paymentIds)
            GROUP BY p.id
            """, nativeQuery = true)
    List<Object[]> findRevenueAdjustmentsByPaymentIds(@Param("paymentIds") List<Long> paymentIds);

    @Query(value = """
            SELECT TO_CHAR(p.updated_at, 'YYYY-MM-DD') AS date,
                   COALESCE(SUM(
                       GREATEST(
                           p.amount - COALESCE((
                               SELECT SUM(related_ro.total_deposit)
                               FROM rental_orders related_ro
                               WHERE related_ro.id = payment_ro.id
                                  OR (
                                       payment_ro.session_id IS NOT NULL
                                       AND related_ro.session_id = payment_ro.session_id
                                  )
                           ), 0),
                           0
                       ) + COALESCE((
                           SELECT SUM(
                               CASE
                                   WHEN related_ro.status = 'COMPLETED' THEN
                                       LEAST(
                                           GREATEST(COALESCE(related_ro.total_deposit, 0), 0),
                                           GREATEST(
                                               COALESCE(related_ro.total_late_fee, 0)
                                               + COALESCE(related_ro.total_damage_fee, 0),
                                               0
                                           )
                                       )
                                   ELSE 0
                               END
                           )
                           FROM rental_orders related_ro
                           WHERE related_ro.id = payment_ro.id
                              OR (
                                   payment_ro.session_id IS NOT NULL
                                   AND related_ro.session_id = payment_ro.session_id
                              )
                       ), 0)
                   ), 0) AS daily_revenue
            FROM payments p
            JOIN rental_orders payment_ro ON payment_ro.id = p.rental_order_id
            WHERE p.updated_at >= :startDate
              AND p.updated_at <= :endDate
              AND p.type = 'PAYMENT'
              AND p.status = 'PAID'
            GROUP BY TO_CHAR(p.updated_at, 'YYYY-MM-DD')
            ORDER BY TO_CHAR(p.updated_at, 'YYYY-MM-DD') ASC
            """, nativeQuery = true)
    List<Object[]> getDailyPaidRevenueExcludingDeposits(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
