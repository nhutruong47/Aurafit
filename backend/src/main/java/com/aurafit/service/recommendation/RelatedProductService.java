package com.aurafit.service.recommendation;

import com.aurafit.dto.response.CatalogCostumeDTO;

import java.util.List;

public interface RelatedProductService {

    List<CatalogCostumeDTO> findRelatedCostumes(Long costumeId, int limit);
}
