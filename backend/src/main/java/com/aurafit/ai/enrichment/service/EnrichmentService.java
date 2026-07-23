package com.aurafit.ai.enrichment.service;

import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeMetadata;
import com.aurafit.ai.enrichment.entity.ProductAiMetadata;
import com.aurafit.ai.enrichment.entity.ProductEmbedding;

public interface EnrichmentService {
    ProductAiMetadata enrichMetadata(Costume costume, CostumeMetadata metadata);

    ProductEmbedding embedProduct(Costume costume, ProductAiMetadata enrichedMetadata);
}
