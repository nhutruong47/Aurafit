package com.aurafit.ai.tryon.service.impl;

import com.aurafit.ai.tryon.dto.request.TryOnResultRequest;
import com.aurafit.ai.tryon.service.TryOnService;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.infrastructure.OpenAiImageEditClient;
import com.aurafit.infrastructure.ReplicateTryOnClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@Slf4j
public class TryOnAsyncWorker {

    private final OpenAiImageEditClient openAiImageEditClient;
    private final ReplicateTryOnClient replicateTryOnClient;
    private final CostumeRepository costumeRepository;
    private final TryOnService tryOnService;

    public TryOnAsyncWorker(
            OpenAiImageEditClient openAiImageEditClient,
            ReplicateTryOnClient replicateTryOnClient,
            CostumeRepository costumeRepository,
            @Lazy TryOnService tryOnService
    ) {
        this.openAiImageEditClient = openAiImageEditClient;
        this.replicateTryOnClient = replicateTryOnClient;
        this.costumeRepository = costumeRepository;
        this.tryOnService = tryOnService;
    }

    @Async("tryOnTaskExecutor")
    public void processTryOnTask(
            Long historyId,
            Long userId,
            MultipartFile personImage,
            String garmentImageUrl,
            Long productId,
            String productName
    ) {
        log.info("Starting async try-on processing for historyId={}", historyId);
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

            TryOnResultRequest result = new TryOnResultRequest();
            result.setGeneratedImageUrl(resultUrl);
            result.setStatus("COMPLETED");
            tryOnService.updateResult(userId, historyId, result);
            log.info("Async try-on completed successfully for historyId={}", historyId);
        } catch (Exception ex) {
            log.error("Async try-on failed for historyId={}: {}", historyId, ex.getMessage());
            TryOnResultRequest failed = new TryOnResultRequest();
            failed.setGeneratedImageUrl("");
            failed.setStatus("FAILED");
            failed.setErrorMessage(ex.getMessage());
            try {
                tryOnService.updateResult(userId, historyId, failed);
            } catch (Exception updateEx) {
                log.warn("Failed to update failed try-on history for historyId={}", historyId, updateEx);
            }
        }
    }
}
