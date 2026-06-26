package com.aurafit.service;

import com.aurafit.dto.request.CostumeMetadataUpsertRequest;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;

public interface CostumeMetadataService {

    CostumeMetadata upsertMetadata(Costume costume, CostumeMetadataUpsertRequest request);
}
