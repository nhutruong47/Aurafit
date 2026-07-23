package com.aurafit.ai.tryon.service.impl;

import com.aurafit.infrastructure.OpenAiImageEditClient;
import com.aurafit.infrastructure.ReplicateTryOnClient;
import com.aurafit.ai.tryon.dto.request.TryOnRequest;
import com.aurafit.ai.tryon.dto.request.TryOnResultRequest;
import com.aurafit.ai.tryon.dto.response.TryOnGenerateResponse;
import com.aurafit.ai.tryon.dto.response.TryOnResponse;
import com.aurafit.ai.tryon.entity.TryOnHistory;
import com.aurafit.ai.tryon.service.TryOnService;
import com.aurafit.business.user.entity.User;
import com.aurafit.common.exception.BadRequestException;
import com.aurafit.common.exception.ResourceNotFoundException;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.ai.tryon.repository.TryOnHistoryRepository;
import com.aurafit.business.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TryOnServiceImpl implements TryOnService {

    private static final Logger log = LoggerFactory.getLogger(TryOnServiceImpl.class);
    private static final long MAX_PERSON_IMAGE_BYTES = 10L * 1024 * 1024;

    private final TryOnHistoryRepository tryOnHistoryRepository;
    private final UserRepository userRepository;
    private final OpenAiImageEditClient openAiImageEditClient;
    private final CostumeRepository costumeRepository;
    private final ReplicateTryOnClient replicateTryOnClient;

    public TryOnServiceImpl(
            TryOnHistoryRepository tryOnHistoryRepository,
            UserRepository userRepository,
            OpenAiImageEditClient openAiImageEditClient,
            CostumeRepository costumeRepository,
            ReplicateTryOnClient replicateTryOnClient
    ) {
        this.tryOnHistoryRepository = tryOnHistoryRepository;
        this.userRepository = userRepository;
        this.openAiImageEditClient = openAiImageEditClient;
        this.costumeRepository = costumeRepository;
        this.replicateTryOnClient = replicateTryOnClient;
    }

    @Override
    @Transactional
    public TryOnGenerateResponse generate(
            Long userId,
            MultipartFile personImage,
            String garmentImageUrl,
            Long productId,
            String productName
    ) {
        validatePersonImage(personImage);

        Long historyId = null;
        if (userId != null) {
            String referenceUrl = StringUtils.hasText(garmentImageUrl) ? garmentImageUrl : "uploaded-person-image";
            TryOnRequest pending = new TryOnRequest();
            pending.setProductId(productId);
            pending.setProductName(productName);
            pending.setOriginalImageUrl(referenceUrl);
            historyId = createRequest(userId, pending).getId();
        }

        try {
            String resultUrl;
            if (replicateTryOnClient.isConfigured()) {
                String categoryName = null;
                if (productId != null) {
                    try {
                        Costume costume = costumeRepository.findById(productId).orElse(null);
                        if (costume != null && costume.getCategory() != null) {
                            categoryName = costume.getCategory().getName();
                        }
                    } catch (Exception e) {
                        log.warn("Failed to fetch product category for try-on", e);
                    }
                }
                resultUrl = replicateTryOnClient.generateTryOnImage(personImage, garmentImageUrl, productName, categoryName);
            } else {
                resultUrl = openAiImageEditClient.generateTryOnImage(personImage, garmentImageUrl, productName);
            }

            if (historyId != null && userId != null) {
                TryOnResultRequest result = new TryOnResultRequest();
                result.setGeneratedImageUrl(resultUrl);
                result.setStatus("COMPLETED");
                updateResult(userId, historyId, result);
            }

            return TryOnGenerateResponse.builder()
                    .resultUrl(resultUrl)
                    .historyId(historyId)
                    .build();
        } catch (RuntimeException ex) {
            if (historyId != null && userId != null) {
                TryOnResultRequest failed = new TryOnResultRequest();
                failed.setGeneratedImageUrl("");
                failed.setStatus("FAILED");
                failed.setErrorMessage(ex.getMessage());
                try {
                    updateResult(userId, historyId, failed);
                } catch (Exception updateEx) {
                    log.warn("Failed to mark try-on history as FAILED: id={}", historyId, updateEx);
                }
            }
            throw ex;
        }
    }

    @Override
    @Transactional
    public TryOnResponse createRequest(Long userId, TryOnRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        TryOnHistory history = TryOnHistory.builder()
                .user(user)
                .productId(request.getProductId())
                .productName(request.getProductName())
                .originalImageUrl(request.getOriginalImageUrl())
                .status("PENDING")
                .build();

        TryOnHistory saved = tryOnHistoryRepository.save(history);
        log.info("TryOn PENDING created: id={} user={} product={}", saved.getId(), userId, request.getProductId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public TryOnResponse updateResult(Long userId, Long historyId, TryOnResultRequest request) {
        TryOnHistory history = tryOnHistoryRepository.findByIdAndUserId(historyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Try-on history", "id", historyId));

        String status = StringUtils.hasText(request.getStatus()) ? request.getStatus() : "COMPLETED";
        history.setStatus(status);
        history.setGeneratedImageUrl(request.getGeneratedImageUrl());
        history.setErrorMessage(request.getErrorMessage());

        TryOnHistory saved = tryOnHistoryRepository.save(history);
        log.info("TryOn {} updated: id={} user={}", status, historyId, userId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TryOnResponse> getHistory(Long userId, int page, int size) {
        return tryOnHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public void deleteHistory(Long userId, Long historyId) {
        TryOnHistory history = tryOnHistoryRepository.findByIdAndUserId(historyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Try-on history", "id", historyId));
        tryOnHistoryRepository.delete(history);
        log.info("TryOn history deleted: id={} user={}", historyId, userId);
    }

    private void validatePersonImage(MultipartFile personImage) {
        if (personImage == null || personImage.isEmpty()) {
            throw new BadRequestException("Thiếu ảnh của bạn");
        }
        String contentType = personImage.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Vui lòng chọn file ảnh");
        }
        if (personImage.getSize() > MAX_PERSON_IMAGE_BYTES) {
            throw new BadRequestException("Ảnh tối đa 10MB");
        }
    }

    private TryOnResponse toResponse(TryOnHistory history) {
        return TryOnResponse.builder()
                .id(history.getId())
                .userId(history.getUser().getId())
                .productId(history.getProductId())
                .productName(history.getProductName())
                .originalImageUrl(history.getOriginalImageUrl())
                .generatedImageUrl(history.getGeneratedImageUrl())
                .status(history.getStatus())
                .errorMessage(history.getErrorMessage())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
