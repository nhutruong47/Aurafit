package com.aurafit.service;

import com.aurafit.dto.response.EnrichmentBatchResponse;
import com.aurafit.entity.Costume;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.ProductEmbedding;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ProductEmbeddingStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ConflictException;
import com.aurafit.repository.CostumeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Slf4j
public class EnrichmentBatchService {

    private final CostumeRepository costumeRepository;
    private final EnrichmentService enrichmentService;
    private final String embeddingModel;
    private final long delayMillis;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public EnrichmentBatchService(
            CostumeRepository costumeRepository,
            EnrichmentService enrichmentService,
            @Value("${ai.embedding-model:}") String embeddingModel,
            @Value("${ai.enrichment-delay-ms:5000}") long delayMillis
    ) {
        this.costumeRepository = costumeRepository;
        this.enrichmentService = enrichmentService;
        this.embeddingModel = embeddingModel == null ? "" : embeddingModel.trim();
        this.delayMillis = Math.max(0L, delayMillis);
    }

    public EnrichmentBatchResponse run() {
        if (!StringUtils.hasText(embeddingModel)) {
            throw new BadRequestException(
                    "AI_EMBEDDING_MODEL is not configured; enrichment batch was not started."
            );
        }
        if (!running.compareAndSet(false, true)) {
            throw new ConflictException("A costume enrichment batch is already running.");
        }

        long batchStartedAt = System.nanoTime();
        try {
            List<Costume> costumes = costumeRepository.findAllByStatusWithMetadataAndTags(CostumeStatus.ACTIVE);
            List<Long> failedCostumeIds = new ArrayList<>();
            int successCount = 0;
            int processedCount = 0;

            log.info(
                    "Costume enrichment batch started totalCostumes={} embeddingModel={} delayMillis={}",
                    costumes.size(),
                    embeddingModel,
                    delayMillis
            );

            for (int index = 0; index < costumes.size(); index++) {
                Costume costume = costumes.get(index);
                long costumeStartedAt = System.nanoTime();
                boolean succeeded = false;
                log.info(
                        "Costume enrichment started costumeId={} position={}/{}",
                        costume.getId(),
                        index + 1,
                        costumes.size()
                );

                try {
                    ProductAiMetadata enrichedMetadata = enrichmentService.enrichMetadata(
                            costume,
                            costume.getMetadata()
                    );
                    pauseBetweenProviderCalls();
                    ProductEmbedding embedding = enrichmentService.embedProduct(costume, enrichedMetadata);
                    succeeded = embedding.getStatus() == ProductEmbeddingStatus.READY;
                    if (succeeded) {
                        successCount++;
                    } else {
                        failedCostumeIds.add(costume.getId());
                    }
                } catch (Exception exception) {
                    failedCostumeIds.add(costume.getId());
                    log.error(
                            "Costume enrichment failed costumeId={} errorType={} message={}",
                            costume.getId(),
                            exception.getClass().getSimpleName(),
                            exception.getMessage(),
                            exception
                    );
                } finally {
                    processedCount++;
                    log.info(
                            "Costume enrichment finished costumeId={} success={} durationMs={}",
                            costume.getId(),
                            succeeded,
                            elapsedMillis(costumeStartedAt)
                    );
                }

                if (index < costumes.size() - 1) {
                    pauseBetweenProviderCalls();
                }
            }

            EnrichmentBatchResponse response = new EnrichmentBatchResponse(
                    costumes.size(),
                    processedCount,
                    successCount,
                    failedCostumeIds.size(),
                    List.copyOf(failedCostumeIds),
                    elapsedMillis(batchStartedAt)
            );
            log.info(
                    "Costume enrichment batch finished totalCostumes={} processed={} success={} failures={} failedCostumeIds={} durationMs={}",
                    response.totalCostumes(),
                    response.processedCount(),
                    response.successCount(),
                    response.failureCount(),
                    response.failedCostumeIds(),
                    response.durationMillis()
            );
            return response;
        } finally {
            running.set(false);
        }
    }

    private void pauseBetweenProviderCalls() {
        if (delayMillis == 0L) {
            return;
        }
        try {
            Thread.sleep(delayMillis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Costume enrichment batch was interrupted.", exception);
        }
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
