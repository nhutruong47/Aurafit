package com.aurafit.service;

import com.aurafit.dto.response.CostumeItemDTO;
import com.aurafit.enums.ItemStatus;

import java.util.List;

public interface CostumeItemService {
    List<CostumeItemDTO> getAvailableItemsByCostumeId(Long costumeId, ItemStatus status);
}
