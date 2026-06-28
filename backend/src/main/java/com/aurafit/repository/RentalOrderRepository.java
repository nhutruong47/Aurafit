package com.aurafit.repository;

import com.aurafit.entity.RentalOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RentalOrderRepository extends JpaRepository<RentalOrder, Long> {

    @Query("SELECT ro FROM RentalOrder ro LEFT JOIN FETCH ro.details WHERE ro.user.id = :userId ORDER BY ro.createdAt DESC")
    List<RentalOrder> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    Optional<RentalOrder> findByIdAndUserId(Long orderId, Long userId);

    @Query("""
            SELECT ro FROM RentalOrder ro
            LEFT JOIN FETCH ro.details rd
            LEFT JOIN FETCH rd.costumeItem ci
            LEFT JOIN FETCH ci.costume
            WHERE ro.id = :orderId AND ro.user.id = :userId
            """)
    Optional<RentalOrder> findByIdAndUserIdWithDetails(
            @Param("orderId") Long orderId,
            @Param("userId") Long userId
    );

    @Query("""
            SELECT ro FROM RentalOrder ro
            LEFT JOIN FETCH ro.details rd
            LEFT JOIN FETCH rd.costumeItem ci
            LEFT JOIN FETCH ci.costume
            WHERE ro.id = :orderId
            """)
    Optional<RentalOrder> findByIdWithDetailsAndCostumes(@Param("orderId") Long orderId);

    @Query("""
            SELECT ro FROM RentalOrder ro
            LEFT JOIN FETCH ro.user
            LEFT JOIN FETCH ro.details rd
            LEFT JOIN FETCH rd.costumeItem ci
            LEFT JOIN FETCH ci.costume
            ORDER BY ro.createdAt DESC
            """)
    List<RentalOrder> findAllOrdersForStaff();

    @Query("SELECT COALESCE(SUM(r.totalPrice), 0) FROM RentalOrder r WHERE r.status IN ('COMPLETED', 'CONFIRMED')")
    java.math.BigDecimal calculateTotalRevenue();

    long countByStatus(com.aurafit.enums.OrderStatus status);

    @Query(value = """
            SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COALESCE(SUM(total_price), 0) as dailyRevenue
            FROM rental_orders
            WHERE created_at >= :startDate AND created_at <= :endDate
              AND status IN ('COMPLETED', 'CONFIRMED')
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY TO_CHAR(created_at, 'YYYY-MM-DD') ASC
            """, nativeQuery = true)
    List<Object[]> getDailyRevenue(@Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);
}
