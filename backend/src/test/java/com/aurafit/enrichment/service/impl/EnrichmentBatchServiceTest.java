package com.aurafit.enrichment.service.impl;

import com.aurafit.ai.enrichment.service.EnrichmentService;
import com.aurafit.ai.enrichment.dto.response.EnrichmentBatchResponse;
import com.aurafit.ai.enrichment.service.impl.EnrichmentBatchService;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeMetadata;
import com.aurafit.ai.enrichment.entity.ProductAiMetadata;
import com.aurafit.ai.enrichment.entity.ProductEmbedding;
import com.aurafit.business.catalog.enums.CostumeStatus;
import com.aurafit.ai.enrichment.enums.ProductEmbeddingStatus;
import com.aurafit.common.exception.BadRequestException;
import com.aurafit.business.catalog.repository.CostumeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EnrichmentBatchServiceTest {

    @Mock
    private CostumeRepository costumeRepository;

    @Mock
    private EnrichmentService enrichmentService;

    @Test
    void run_shouldProcessActiveCostumesSequentiallyAndReportEmbeddingFailures() {
        Costume first = costume(1L);
        Costume second = costume(2L);
        ProductAiMetadata firstMetadata = ProductAiMetadata.builder().costumeId(1L).build();
        ProductAiMetadata secondMetadata = ProductAiMetadata.builder().costumeId(2L).build();
        when(costumeRepository.findAllByStatusWithMetadataAndTags(CostumeStatus.ACTIVE))
                .thenReturn(List.of(first, second));
        when(enrichmentService.enrichMetadata(first, first.getMetadata())).thenReturn(firstMetadata);
        when(enrichmentService.enrichMetadata(second, second.getMetadata())).thenReturn(secondMetadata);
        when(enrichmentService.embedProduct(first, firstMetadata)).thenReturn(ProductEmbedding.builder()
                .costumeId(1L)
                .status(ProductEmbeddingStatus.READY)
                .build());
        when(enrichmentService.embedProduct(second, secondMetadata)).thenReturn(ProductEmbedding.builder()
                .costumeId(2L)
                .status(ProductEmbeddingStatus.FAILED)
                .build());
        EnrichmentBatchService service = new EnrichmentBatchService(
                costumeRepository,
                enrichmentService,
                "text-embedding-test",
                0L
        );

        EnrichmentBatchResponse response = service.run();

        assertEquals(2, response.totalCostumes());
        assertEquals(2, response.processedCount());
        assertEquals(1, response.successCount());
        assertEquals(1, response.failureCount());
        assertEquals(List.of(2L), response.failedCostumeIds());

        InOrder order = inOrder(enrichmentService);
        order.verify(enrichmentService).enrichMetadata(first, first.getMetadata());
        order.verify(enrichmentService).embedProduct(first, firstMetadata);
        order.verify(enrichmentService).enrichMetadata(second, second.getMetadata());
        order.verify(enrichmentService).embedProduct(second, secondMetadata);
    }

    @Test
    void run_shouldFailBeforeReadingCatalogWhenEmbeddingModelIsBlank() {
        EnrichmentBatchService service = new EnrichmentBatchService(
                costumeRepository,
                enrichmentService,
                " ",
                0L
        );

        BadRequestException exception = assertThrows(BadRequestException.class, service::run);

        assertEquals(
                "AI_EMBEDDING_MODEL is not configured; enrichment batch was not started.",
                exception.getMessage()
        );
        verify(costumeRepository, never()).findAllByStatusWithMetadataAndTags(CostumeStatus.ACTIVE);
    }

    private Costume costume(Long id) {
        CostumeMetadata metadata = CostumeMetadata.builder()
                .style("style-" + id)
                .occasion("occasion-" + id)
                .season("season-" + id)
                .color("color-" + id)
                .build();
        Costume costume = Costume.builder()
                .id(id)
                .name("costume-" + id)
                .metadata(metadata)
                .build();
        metadata.setCostume(costume);
        return costume;
    }
}
