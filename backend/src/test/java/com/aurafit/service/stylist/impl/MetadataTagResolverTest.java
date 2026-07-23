package com.aurafit.service.stylist.impl;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.repository.ProductAiMetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MetadataTagResolverTest {

    @Mock
    private ProductAiMetadataRepository productAiMetadataRepository;

    private MetadataTagResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new MetadataTagResolver(productAiMetadataRepository);
    }

    @Test
    void resolve_shouldMapApproximateAndUnaccentedValuesToCorrespondingCanonicalTags() {
        when(productAiMetadataRepository.findAll()).thenReturn(metadataRows());
        StylistFilterCriteria rawIntent = criteria(
                "thanh lich",
                "da tiec",
                "mua he",
                "đỏ tươi",
                "nu"
        );

        StylistFilterCriteria resolved = resolver.resolve(rawIntent);

        assertEquals("thanh lịch", resolved.style());
        assertEquals("dạ tiệc", resolved.occasion());
        assertEquals("mùa hè", resolved.season());
        assertEquals("đỏ", resolved.color());
        assertEquals("nữ", resolved.gender());
    }

    @Test
    void resolve_shouldKeepOriginalValueWhenNoTagReachesThreshold() {
        when(productAiMetadataRepository.findAll()).thenReturn(metadataRows());
        StylistFilterCriteria rawIntent = criteria("cyberpunk", null, null, null, null);

        StylistFilterCriteria resolved = resolver.resolve(rawIntent);

        assertEquals("cyberpunk", resolved.style());
    }

    @Test
    void resolve_shouldPreserveRequestedItemWhileNormalizingMetadataTags() {
        when(productAiMetadataRepository.findAll()).thenReturn(metadataRows());
        StylistFilterCriteria rawIntent = new StylistFilterCriteria(
                "su-kien",
                "bikini",
                "thanh lich",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        StylistFilterCriteria resolved = resolver.resolve(rawIntent);

        assertEquals("bikini", resolved.requestedItem());
        assertEquals("thanh lịch", resolved.style());
    }

    @Test
    void resolve_shouldSkipNullValuesAndAvoidLoadingCatalogWhenNothingCanBeResolved() {
        StylistFilterCriteria rawIntent = criteria(null, null, null, null, null);

        StylistFilterCriteria resolved = resolver.resolve(rawIntent);

        assertNull(resolved.style());
        assertNull(resolved.occasion());
        assertNull(resolved.season());
        assertNull(resolved.color());
        assertNull(resolved.gender());
        verifyNoInteractions(productAiMetadataRepository);
    }

    @Test
    void resolve_shouldReuseInMemoryCatalogWithinCacheTtl() {
        when(productAiMetadataRepository.findAll()).thenReturn(metadataRows());

        resolver.resolve(criteria(null, null, null, "đỏ tươi", null));
        resolver.resolve(criteria(null, null, null, "do", null));

        verify(productAiMetadataRepository, times(1)).findAll();
    }

    private StylistFilterCriteria criteria(
            String style,
            String occasion,
            String season,
            String color,
            String gender
    ) {
        return new StylistFilterCriteria(
                "su-kien",
                style,
                occasion,
                season,
                color,
                gender,
                List.of("tag-gốc"),
                null,
                null
        );
    }

    private List<ProductAiMetadata> metadataRows() {
        return List.of(ProductAiMetadata.builder()
                .costumeId(1L)
                .styleTags(List.of("thanh lịch"))
                .occasionTags(List.of("dạ tiệc"))
                .seasonTags(List.of("mùa hè"))
                .colorTags(List.of("đỏ"))
                .genderTags(List.of("nữ"))
                .build());
    }
}
