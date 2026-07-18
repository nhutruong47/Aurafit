package com.aurafit.repository;

import com.aurafit.dto.response.InventorySummaryDTO;
import com.aurafit.entity.CostumeItem;
import com.aurafit.enums.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<CostumeItem, Long> {

    @Query("""
            SELECT ci.costume.id, COUNT(ci)
            FROM CostumeItem ci
            WHERE ci.costume.id IN :costumeIds
              AND ci.status = :status
            GROUP BY ci.costume.id
            """)
    List<Object[]> getAvailableItemCountsByCostumeIds(
            @Param("costumeIds") List<Long> costumeIds,
            @Param("status") ItemStatus status
    );

    /**
     * Counts items by costume grouped by color/size, restricted to statuses that
     * still belong to the public stock pool (AVAILABLE + RESERVED). Used for the
     * storefront availability badge so users see what the store physically owns
     * even while some units are being held by pending orders.
     */
    @Query("SELECT ci.costume.id, COUNT(ci) " +
           "FROM CostumeItem ci " +
           "WHERE ci.costume.id IN :costumeIds " +
           "AND ci.status IN (com.aurafit.enums.ItemStatus.AVAILABLE, com.aurafit.enums.ItemStatus.RESERVED) " +
           "GROUP BY ci.costume.id")
    List<Object[]> getPooledItemCountsByCostumeIds(@Param("costumeIds") List<Long> costumeIds);

    @Query("SELECT new com.aurafit.dto.response.InventorySummaryDTO(ci.costume.id, ci.color, ci.size, COUNT(ci)) " +
           "FROM CostumeItem ci " +
           "WHERE ci.costume.id = :costumeId AND ci.status = :status " +
           "GROUP BY ci.costume.id, ci.color, ci.size")
    List<InventorySummaryDTO> getInventorySummaryByCostumeId(@Param("costumeId") Long costumeId, @Param("status") ItemStatus status);

    @Query("SELECT new com.aurafit.dto.response.InventorySummaryDTO(ci.costume.id, ci.color, ci.size, COUNT(ci)) " +
           "FROM CostumeItem ci " +
           "WHERE ci.costume.id = :costumeId " +
           "AND ci.status IN (com.aurafit.enums.ItemStatus.AVAILABLE, com.aurafit.enums.ItemStatus.RESERVED) " +
           "GROUP BY ci.costume.id, ci.color, ci.size")
    List<InventorySummaryDTO> getPooledInventorySummaryByCostumeId(@Param("costumeId") Long costumeId);
}
