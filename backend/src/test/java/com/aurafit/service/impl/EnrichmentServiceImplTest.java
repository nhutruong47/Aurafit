package com.aurafit.service.impl;

import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.ProductEmbedding;
import com.aurafit.enums.AiCallType;
import com.aurafit.enums.AiErrorType;
import com.aurafit.enums.ProductEmbeddingSourceType;
import com.aurafit.enums.ProductEmbeddingStatus;
import com.aurafit.exception.AiProviderException;
import com.aurafit.integration.ai.GeminiClient;
import com.aurafit.repository.ProductAiMetadataRepository;
import com.aurafit.repository.ProductEmbeddingRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EnrichmentServiceImplTest {

    private static final String ENRICHED_JSON = """
            {
              "color_tags_json": [" Đỏ ", "RED", "đỏ"],
              "fit_tags_json": ["ôm dáng"],
              "gender_tags_json": ["nữ"],
              "material_tags_json": ["lụa"],
              "occasion_tags_json": ["dạ tiệc"],
              "season_tags_json": ["quanh năm"],
              "size_tags_json": ["m"],
              "style_tags_json": ["thanh lịch"],
              "trend_tags_json": ["quiet luxury"]
            }
            """;

    @Mock
    private GeminiClient geminiClient;

    @Mock
    private ProductAiMetadataRepository productAiMetadataRepository;

    @Mock
    private ProductEmbeddingRepository productEmbeddingRepository;

    private EnrichmentServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new EnrichmentServiceImpl(
                geminiClient,
                productAiMetadataRepository,
                productEmbeddingRepository,
                new ObjectMapper(),
                "text-embedding-test"
        );
    }

    @Test
    void enrichMetadata_shouldSendAllRequestedSourceFieldsAndUpsertNormalizedTags() {
        Costume costume = costume();
        CostumeMetadata metadata = CostumeMetadata.builder()
                .style("Sang trọng")
                .occasion("Dạ tiệc")
                .season("Quanh năm")
                .color("Đỏ")
                .material("Lụa")
                .fitNote("Ôm nhẹ phần eo")
                .tags(List.of("luxury", "evening"))
                .build();
        when(geminiClient.generateJson(eq(AiCallType.METADATA_ENRICHMENT), anyString(), anyString()))
                .thenReturn(ENRICHED_JSON);
        when(productAiMetadataRepository.findByCostumeId(42L)).thenReturn(Optional.empty());
        when(productAiMetadataRepository.save(any(ProductAiMetadata.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ProductAiMetadata result = service.enrichMetadata(costume, metadata);

        assertEquals(42L, result.getCostumeId());
        assertEquals(List.of("đỏ", "red"), result.getColorTags());
        assertEquals(List.of("ôm dáng"), result.getFitTags());
        assertEquals(List.of("quiet luxury"), result.getTrendTags());

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient).generateJson(
                eq(AiCallType.METADATA_ENRICHMENT),
                anyString(),
                promptCaptor.capture()
        );
        String prompt = promptCaptor.getValue();
        assertTrue(prompt.contains("Váy dạ tiệc đỏ"));
        assertTrue(prompt.contains("Mô tả đầy đủ của sản phẩm"));
        assertTrue(prompt.contains("Sang trọng"));
        assertTrue(prompt.contains("Dạ tiệc"));
        assertTrue(prompt.contains("Quanh năm"));
        assertTrue(prompt.contains("Đỏ"));
        assertTrue(prompt.contains("Lụa"));
        assertTrue(prompt.contains("Ôm nhẹ phần eo"));
        assertTrue(prompt.contains("luxury"));
    }

    @Test
    void embedProduct_shouldPersistReadyVectorWithSnapshotAndHash() {
        Costume costume = costume();
        ProductAiMetadata metadata = enrichedMetadata();
        when(productEmbeddingRepository.findByCostumeId(42L)).thenReturn(Optional.empty());
        when(geminiClient.embedText(eq("text-embedding-test"), anyString()))
                .thenReturn(new GeminiClient.EmbeddingResult(
                        "text-embedding-test",
                        List.of(0.1f, -0.2f, 0.3f)
                ));
        when(productEmbeddingRepository.save(any(ProductEmbedding.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ProductEmbedding result = service.embedProduct(costume, metadata);

        assertEquals(42L, result.getCostumeId());
        assertEquals(ProductEmbeddingSourceType.PRODUCT_METADATA, result.getSourceType());
        assertEquals(ProductEmbeddingStatus.READY, result.getStatus());
        assertEquals("text-embedding-test", result.getEmbeddingModel());
        assertEquals(3, result.getEmbeddingDimension());
        assertEquals("[0.1,-0.2,0.3]", result.getEmbeddingPayload());
        assertTrue(result.getTextSnapshot().contains("Váy dạ tiệc đỏ"));
        assertTrue(result.getTextSnapshot().contains("quiet luxury"));
        assertNotNull(result.getTextHash());
        assertEquals(64, result.getTextHash().length());
        assertEquals(null, result.getLastError());
    }

    @Test
    void embedProduct_shouldPersistFailedStateWithoutThrowing() {
        Costume costume = costume();
        when(productEmbeddingRepository.findByCostumeId(42L)).thenReturn(Optional.empty());
        when(geminiClient.embedText(eq("text-embedding-test"), anyString()))
                .thenThrow(new AiProviderException(
                        AiErrorType.TIMEOUT,
                        "provider timeout details",
                        "Gemini tạm thời phản hồi chậm."
                ));
        when(productEmbeddingRepository.save(any(ProductEmbedding.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ProductEmbedding result = assertDoesNotThrow(
                () -> service.embedProduct(costume, enrichedMetadata())
        );

        assertEquals(ProductEmbeddingStatus.FAILED, result.getStatus());
        assertEquals(0, result.getEmbeddingDimension());
        assertEquals("[]", result.getEmbeddingPayload());
        assertEquals("TIMEOUT: Gemini tạm thời phản hồi chậm.", result.getLastError());
        verify(productEmbeddingRepository).save(result);
    }

    private Costume costume() {
        return Costume.builder()
                .id(42L)
                .name("Váy dạ tiệc đỏ")
                .description("Mô tả đầy đủ của sản phẩm")
                .build();
    }

    private ProductAiMetadata enrichedMetadata() {
        return ProductAiMetadata.builder()
                .costumeId(42L)
                .colorTags(List.of("đỏ", "red"))
                .fitTags(List.of("ôm dáng"))
                .genderTags(List.of("nữ"))
                .materialTags(List.of("lụa"))
                .occasionTags(List.of("dạ tiệc"))
                .seasonTags(List.of("quanh năm"))
                .sizeTags(List.of("m"))
                .styleTags(List.of("thanh lịch"))
                .trendTags(List.of("quiet luxury"))
                .build();
    }
}
