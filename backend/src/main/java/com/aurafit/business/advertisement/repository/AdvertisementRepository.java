package com.aurafit.business.advertisement.repository;

import com.aurafit.business.advertisement.entity.AdPosition;
import com.aurafit.business.advertisement.entity.Advertisement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvertisementRepository extends JpaRepository<Advertisement, Long> {
    List<Advertisement> findByIsActiveTrueOrderByDisplayOrderAsc();
    List<Advertisement> findByIsActiveTrueAndPositionOrderByDisplayOrderAsc(AdPosition position);
}
