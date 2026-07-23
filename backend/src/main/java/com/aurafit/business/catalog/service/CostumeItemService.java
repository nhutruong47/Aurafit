package com.aurafit.business.catalog.service;

import com.aurafit.business.catalog.dto.request.CostumeItemCreateRequest;
import com.aurafit.business.catalog.dto.request.CostumeItemUpdateRequest;
import com.aurafit.business.catalog.dto.response.CostumeItemDTO;
import com.aurafit.business.catalog.enums.ItemStatus;

import java.util.List;

public interface CostumeItemService {
    List<CostumeItemDTO> getAvailableItemsByCostumeId(Long costumeId, ItemStatus status);

    List<CostumeItemDTO> getItemsByCostumeId(Long costumeId, String authenticatedEmail);

    CostumeItemDTO createCostumeItem(Long costumeId, CostumeItemCreateRequest request, String authenticatedEmail);

    CostumeItemDTO updateCostumeItem(Long costumeId, Long itemId, CostumeItemUpdateRequest request,
                                     String authenticatedEmail);

    void deleteCostumeItem(Long costumeId, Long itemId, String authenticatedEmail);
}
