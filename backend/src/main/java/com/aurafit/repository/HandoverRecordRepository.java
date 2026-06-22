package com.aurafit.repository;

import com.aurafit.entity.HandoverRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HandoverRecordRepository extends JpaRepository<HandoverRecord, Long> {

    @Query("""
            SELECT h FROM HandoverRecord h
            WHERE h.rentalOrderDetail.id = :detailId
            ORDER BY h.createdAt DESC
            """)
    List<HandoverRecord> findByRentalOrderDetailId(@Param("detailId") Long detailId);

    @Query("""
            SELECT h FROM HandoverRecord h
            JOIN FETCH h.rentalOrderDetail rd
            JOIN FETCH rd.rentalOrder ro
            WHERE ro.id = :orderId
            ORDER BY h.createdAt DESC
            """)
    List<HandoverRecord> findByOrderId(@Param("orderId") Long orderId);
}
