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
}
