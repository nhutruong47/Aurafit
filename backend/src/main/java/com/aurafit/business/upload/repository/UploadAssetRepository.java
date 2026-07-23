package com.aurafit.business.upload.repository;

import com.aurafit.business.upload.entity.UploadAsset;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UploadAssetRepository extends JpaRepository<UploadAsset, Long> {
}
