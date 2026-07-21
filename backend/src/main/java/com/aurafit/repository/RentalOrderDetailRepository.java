package com.aurafit.repository;

import com.aurafit.enums.OrderStatus;
import com.aurafit.entity.RentalOrderDetail;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface RentalOrderDetailRepository extends JpaRepository<RentalOrderDetail, Long> {

    List<RentalOrderDetail> findByRentalOrderId(Long orderId);

    boolean existsByRentalOrder_User_IdAndCostumeItem_Costume_IdAndRentalOrder_StatusIn(
            Long userId,
            Long costumeId,
            List<OrderStatus> statuses
    );

    @Query("""
            SELECT DISTINCT rd.costumeItem.id
            FROM RentalOrderDetail rd
            JOIN rd.rentalOrder ro
            WHERE rd.costumeItem.id IN :costumeItemIds
              AND ro.status <> :cancelledStatus
              AND rd.rentalStartDate <= :requestedEnd
              AND rd.rentalEndDate >= :requestedStart
            """)
    List<Long> findBookedCostumeItemIdsForPeriod(
            @Param("costumeItemIds") Collection<Long> costumeItemIds,
            @Param("requestedStart") java.time.LocalDate requestedStart,
            @Param("requestedEnd") java.time.LocalDate requestedEnd,
            @Param("cancelledStatus") OrderStatus cancelledStatus
    );

    @Query("""
            SELECT new com.aurafit.dto.response.TopCostumeDTO(
                c.name, ci.sku, SUM(d.rentalDays)
            )
            FROM RentalOrderDetail d
            JOIN d.costumeItem ci
            JOIN ci.costume c
            GROUP BY c.name, ci.sku
            ORDER BY SUM(d.rentalDays) DESC
            """)
    List<com.aurafit.dto.response.TopCostumeDTO> findTopCostumes(Pageable pageable);
}
