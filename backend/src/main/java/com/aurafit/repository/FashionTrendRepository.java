package com.aurafit.repository;

import com.aurafit.entity.FashionTrend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FashionTrendRepository extends JpaRepository<FashionTrend, Long> {

    @Query("""
            SELECT ft FROM FashionTrend ft
            WHERE (ft.activeFrom IS NULL OR ft.activeFrom <= :timestamp)
              AND (ft.activeTo IS NULL OR ft.activeTo >= :timestamp)
            ORDER BY ft.boostScore DESC, ft.updatedAt DESC
            """)
    List<FashionTrend> findActiveTrends(@Param("timestamp") LocalDateTime timestamp);
}
