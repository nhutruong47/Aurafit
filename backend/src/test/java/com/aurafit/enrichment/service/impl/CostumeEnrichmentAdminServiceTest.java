package com.aurafit.enrichment.service.impl;

import com.aurafit.ai.enrichment.service.EnrichmentService;
import com.aurafit.ai.enrichment.dto.response.CostumeEnrichmentResponse;
import com.aurafit.ai.enrichment.service.impl.CostumeEnrichmentAdminService;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeMetadata;
import com.aurafit.ai.enrichment.entity.ProductAiMetadata;
import com.aurafit.ai.enrichment.entity.ProductEmbedding;
import com.aurafit.ai.enrichment.enums.ProductEmbeddingStatus;
import com.aurafit.common.exception.BadRequestException;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.ai.enrichment.repository.ProductAiMetadataRepository;
import com.aurafit.ai.enrichment.repository.ProductEmbeddingRepository;
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
class CostumeEnrichmentAdminServiceTest {

    @Mock
    private CostumeRepository costumeRepository;

    @Mock
    private ProductAiMetadataRepository productAiMetadataRepository;

    @Mock
    private ProductEmbeddingRepository productEmbeddingRepository;

    @Mock
    private EnrichmentService enrichmentService;

    @Test
    void enrichOne_shouldOnlyEnrichRequestedCostumeAndReturnPersistedResult() {
        CostumeMetadata rawMetadata = CostumeMetadata.builder().style("elegant").build();
        Costume costume = Costume.builder().id(7L).name("Evening dress").metadata(rawMetadata).build();
        ProductAiMetadata enrichedMetadata = ProductAiMetadata.builder()
                .id(11L)
                .costumeId(7L)
                .styleTags(List.of("thanh lịch", "elegant"))
                .build();
        ProductEmbedding embedding = ProductEmbedding.builder()
                .id(12L)
                .costumeId(7L)
                .embeddingModel("text-embedding-test")
                .embeddingDimension(768)
                .status(ProductEmbeddingStatus.READY)
                .build();
        when(costumeRepository.findAllByIdWithMetadata(List.of(7L))).thenReturn(List.of(costume));
        when(enrichmentService.enrichMetadata(costume, rawMetadata)).thenReturn(enrichedMetadata);
        when(enrichmentService.embedProduct(costume, enrichedMetadata)).thenReturn(embedding);
        CostumeEnrichmentAdminService service = service("text-embedding-test");

        CostumeEnrichmentResponse response = service.enrichOne(7L);

        assertEquals(7L, response.costumeId());
        assertEquals(List.of("thanh lịch", "elegant"), response.metadata().styleTags());
        assertEquals(ProductEmbeddingStatus.READY, response.embedding().status());
        InOrder order = inOrder(enrichmentService);
        order.verify(enrichmentService).enrichMetadata(costume, rawMetadata);
        order.verify(enrichmentService).embedProduct(costume, enrichedMetadata);
        verify(costumeRepository, never()).findAllByStatusWithMetadataAndTags(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void enrichOne_shouldFailBeforeReadingCostumeWhenEmbeddingModelIsBlank() {
        CostumeEnrichmentAdminService service = service(" ");

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.enrichOne(7L)
        );

        assertEquals(
                "AI_EMBEDDING_MODEL is not configured; costume enrichment was not started.",
                exception.getMessage()
        );
        verify(costumeRepository, never()).findAllByIdWithMetadata(List.of(7L));
    }

    private CostumeEnrichmentAdminService service(String embeddingModel) {
        return new CostumeEnrichmentAdminService(
                costumeRepository,
                productAiMetadataRepository,
                productEmbeddingRepository,
                enrichmentService,
                embeddingModel
        );
    }
}
