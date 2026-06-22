package com.aurafit.service;

import com.aurafit.dto.response.UploadAssetResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UploadService {

    UploadAssetResponse uploadImage(Long userId, MultipartFile file);
}
