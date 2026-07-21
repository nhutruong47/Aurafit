package com.aurafit.service;

import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.entity.ProductAiMetadata;
import com.aurafit.entity.ProductEmbedding;

public interface EnrichmentService {
    ProductAiMetadata enrichMetadata(Costume costume, CostumeMetadata metadata);

    ProductEmbedding embedProduct(Costume costume, ProductAiMetadata enrichedMetadata);
}
