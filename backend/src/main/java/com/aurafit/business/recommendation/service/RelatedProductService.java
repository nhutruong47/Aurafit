package com.aurafit.business.recommendation.service;

import com.aurafit.business.catalog.dto.response.CatalogCostumeDTO;

import java.util.List;

public interface RelatedProductService {

    List<CatalogCostumeDTO> findRelatedCostumes(Long costumeId, int limit);
}
