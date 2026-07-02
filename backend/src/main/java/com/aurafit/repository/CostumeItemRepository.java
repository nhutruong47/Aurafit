package com.aurafit.repository;

import com.aurafit.entity.CostumeItem;
import com.aurafit.enums.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CostumeItemRepository extends JpaRepository<CostumeItem, Long> {

    /**
     * Finds all physical items for a costume model filtered by status.
     * Used by the frontend to display available sizes/colors for a costume.
     */
    List<CostumeItem> findByCostumeIdAndStatus(Long costumeId, ItemStatus status);

    /**
     * Fetches a CostumeItem with its parent Costume eagerly loaded.
     * Avoids an extra query when we need the rental price from the Costume.
     */
    @Query("SELECT ci FROM CostumeItem ci JOIN FETCH ci.costume WHERE ci.id = :id")
    Optional<CostumeItem> findByIdWithCostume(@Param("id") Long id);

    /**
     * Bulk-updates the status of multiple CostumeItems by their IDs.
     * Used during checkout to lock inventory by marking items as RENTED.
     */
    @Modifying
    @Query("UPDATE CostumeItem ci SET ci.status = :newStatus WHERE ci.id IN :ids")
    int updateStatusByIds(@Param("ids") List<Long> ids, @Param("newStatus") ItemStatus newStatus);

    /**
     * Finds a physical item by its SKU, used during direct checkout to
     * locate the exact CostumeItem without needing its database ID.
     */
    Optional<CostumeItem> findBySku(String sku);

    /**
     * Finds a physical item by its SKU and locks the row for update.
     * Used during checkout to prevent double-booking race conditions.
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ci FROM CostumeItem ci WHERE ci.sku = :sku")
    Optional<CostumeItem> findBySkuForUpdate(@Param("sku") String sku);

    /**
     * Dynamically count available stock for a specific costume and size.
     */
    @Query("SELECT COUNT(ci) FROM CostumeItem ci WHERE ci.costume.id = :costumeId AND ci.size = :size AND ci.status = :status")
    int countByCostumeIdAndSizeAndStatus(@Param("costumeId") Long costumeId, @Param("size") String size, @Param("status") ItemStatus status);

    /**
     * Dynamically fetch and lock N available items for a specific costume and size.
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ci FROM CostumeItem ci WHERE ci.costume.id = :costumeId AND ci.size = :size AND ci.status = :status")
    List<CostumeItem> findAvailableItemsForUpdate(@Param("costumeId") Long costumeId, @Param("size") String size, @Param("status") ItemStatus status, org.springframework.data.domain.Pageable pageable);
}
