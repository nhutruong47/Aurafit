package com.aurafit.business.upload.service;

import com.aurafit.business.upload.dto.response.UploadAssetResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UploadService {

    UploadAssetResponse uploadImage(Long userId, MultipartFile file);
}
