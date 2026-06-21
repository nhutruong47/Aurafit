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
}
