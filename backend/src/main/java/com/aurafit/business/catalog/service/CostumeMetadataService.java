package com.aurafit.business.catalog.service;

import com.aurafit.ai.enrichment.dto.request.CostumeMetadataUpsertRequest;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeMetadata;

public interface CostumeMetadataService {

    CostumeMetadata upsertMetadata(Costume costume, CostumeMetadataUpsertRequest request);
}
