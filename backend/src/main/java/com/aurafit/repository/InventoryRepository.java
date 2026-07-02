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
    
    @Query("SELECT new com.aurafit.dto.response.InventorySummaryDTO(ci.costume.id, ci.color, ci.size, COUNT(ci)) " +
           "FROM CostumeItem ci " +
           "WHERE ci.costume.id = :costumeId AND ci.status = :status " +
           "GROUP BY ci.costume.id, ci.color, ci.size")
    List<InventorySummaryDTO> getInventorySummaryByCostumeId(@Param("costumeId") Long costumeId, @Param("status") ItemStatus status);
}
