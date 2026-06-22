package com.aurafit.dto.response;

import com.aurafit.entity.UploadAsset;

import java.time.LocalDateTime;

public record UploadAssetResponse(
        Long id,
        String originalFileName,
        String url,
        String secureUrl,
        String publicId,
        String resourceType,
        String format,
        Long size,
        LocalDateTime uploadedAt
) {
    public static UploadAssetResponse fromEntity(UploadAsset asset) {
        return new UploadAssetResponse(
                asset.getId(),
                asset.getOriginalFileName(),
                asset.getUrl(),
                asset.getSecureUrl(),
                asset.getPublicId(),
                asset.getResourceType(),
                asset.getFormat(),
                asset.getSize(),
                asset.getCreatedAt()
        );
    }
}
