package com.aurafit.service.impl;

import com.aurafit.config.CloudinaryProperties;
import com.aurafit.dto.response.UploadAssetResponse;
import com.aurafit.entity.UploadAsset;
import com.aurafit.entity.User;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.FileUploadException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UploadAssetRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.UploadService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional
public class UploadServiceImpl implements UploadService {

    private static final Logger log = LoggerFactory.getLogger(UploadServiceImpl.class);

    private static final byte[] JPEG_SIGNATURE = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_SIGNATURE = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final String RIFF = "RIFF";
    private static final String WEBP = "WEBP";

    private final Cloudinary cloudinary;
    private final UploadAssetRepository uploadAssetRepository;
    private final UserRepository userRepository;
    private final String imageFolder;
    private final long maxImageSizeBytes;

    public UploadServiceImpl(
            Cloudinary cloudinary,
            CloudinaryProperties cloudinaryProperties,
            UploadAssetRepository uploadAssetRepository,
            UserRepository userRepository,
            @Value("${app.upload.image-folder:aurafit}") String imageFolder,
            @Value("${app.upload.max-image-size-bytes:5242880}") long maxImageSizeBytes
    ) {
        this.cloudinary = cloudinary;
        this.uploadAssetRepository = uploadAssetRepository;
        this.userRepository = userRepository;
        this.imageFolder = imageFolder;
        this.maxImageSizeBytes = maxImageSizeBytes;

        // Force validated Cloudinary properties to be resolved when the upload service is wired.
        cloudinaryProperties.cloudName();
    }

    @Override
    public UploadAssetResponse uploadImage(Long userId, MultipartFile file) {
        validateMultipartFile(file);

        byte[] content = readContent(file);
        validateFileSize(content.length);

        String rawOriginalFileName = file.getOriginalFilename();
        if (!StringUtils.hasText(rawOriginalFileName)) {
            throw new BadRequestException("Tên tệp tải lên không hợp lệ.");
        }

        String originalFileName = StringUtils.cleanPath(rawOriginalFileName);
        String extension = getRequiredExtension(originalFileName);
        String detectedFormat = detectImageFormat(content);
        validateExtensionMatchesFormat(extension, detectedFormat);

        Map<?, ?> uploadResult = uploadToCloudinary(content, originalFileName);
        String publicId = getRequiredString(uploadResult, "public_id");

        try {
            User uploadedBy = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            UploadAsset asset = UploadAsset.builder()
                    .originalFileName(originalFileName)
                    .url(getRequiredString(uploadResult, "url"))
                    .secureUrl(getRequiredString(uploadResult, "secure_url"))
                    .publicId(publicId)
                    .resourceType(getRequiredString(uploadResult, "resource_type"))
                    .format(getRequiredString(uploadResult, "format"))
                    .size(getRequiredLong(uploadResult, "bytes"))
                    .uploadedBy(uploadedBy)
                    .build();

            UploadAsset savedAsset = uploadAssetRepository.save(asset);
            return UploadAssetResponse.fromEntity(savedAsset);
        } catch (RuntimeException ex) {
            deleteCloudinaryAssetQuietly(publicId);
            throw ex;
        }
    }

    private void validateMultipartFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn tệp để tải lên.");
        }
    }

    private void validateFileSize(long size) {
        if (size > maxImageSizeBytes) {
            throw new BadRequestException("Kich thuoc anh vuot qua gioi han cho phep.");
        }
    }

    private byte[] readContent(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new FileUploadException("Không thể đọc dữ liệu từ tệp tải lên.", ex);
        }
    }

    private String getRequiredExtension(String originalFileName) {
        String extension = StringUtils.getFilenameExtension(originalFileName);
        if (!StringUtils.hasText(extension)) {
            throw new BadRequestException("Ten tep phai co duoi jpg, jpeg, png hoac webp.");
        }

        String normalizedExtension = extension.toLowerCase(Locale.ROOT);
        if (!normalizedExtension.equals("jpg")
                && !normalizedExtension.equals("jpeg")
                && !normalizedExtension.equals("png")
                && !normalizedExtension.equals("webp")) {
            throw new BadRequestException("Chi chap nhan anh jpg, jpeg, png hoac webp.");
        }

        return normalizedExtension;
    }

    private String detectImageFormat(byte[] content) {
        if (startsWith(content, JPEG_SIGNATURE)) {
            return "jpg";
        }

        if (startsWith(content, PNG_SIGNATURE)) {
            return "png";
        }

        if (content.length >= 12
                && RIFF.equals(new String(content, 0, 4, StandardCharsets.US_ASCII))
                && WEBP.equals(new String(content, 8, 4, StandardCharsets.US_ASCII))) {
            return "webp";
        }

        throw new BadRequestException("Tệp tải lên không phải là định dạng ảnh hợp lệ.");
    }

    private void validateExtensionMatchesFormat(String extension, String detectedFormat) {
        boolean jpegMatch = detectedFormat.equals("jpg") && (extension.equals("jpg") || extension.equals("jpeg"));
        boolean exactMatch = detectedFormat.equals(extension);

        if (!jpegMatch && !exactMatch) {
            throw new BadRequestException("Định dạng tệp không khớp với nội dung ảnh tải lên.");
        }
    }

    private Map<?, ?> uploadToCloudinary(byte[] content, String originalFileName) {
        try {
            return cloudinary.uploader().upload(content, ObjectUtils.asMap(
                    "folder", imageFolder,
                    "resource_type", "image",
                    "use_filename", true,
                    "unique_filename", true,
                    "overwrite", false,
                    "filename_override", originalFileName
            ));
        } catch (IOException ex) {
            throw new FileUploadException("Tải ảnh lên máy chủ lưu trữ thất bại.", ex);
        }
    }

    private void deleteCloudinaryAssetQuietly(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                    "resource_type", "image",
                    "invalidate", true
            ));
        } catch (Exception ex) {
            log.warn("Khong the xoa Cloudinary asset {} sau khi luu DB that bai: {}", publicId, ex.getMessage());
        }
    }

    private String getRequiredString(Map<?, ?> payload, String key) {
        Object value = payload.get(key);
        if (!(value instanceof String text) || !StringUtils.hasText(text)) {
            throw new FileUploadException("Phan hoi Cloudinary thieu truong bat buoc: " + key);
        }
        return text;
    }

    private Long getRequiredLong(Map<?, ?> payload, String key) {
        Object value = payload.get(key);
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new FileUploadException("Phan hoi Cloudinary thieu truong so bat buoc: " + key);
    }

    private boolean startsWith(byte[] content, byte[] signature) {
        if (content.length < signature.length) {
            return false;
        }

        for (int i = 0; i < signature.length; i++) {
            if (content[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }
}
