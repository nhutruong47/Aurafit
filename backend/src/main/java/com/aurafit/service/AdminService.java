package com.aurafit.service;

import com.aurafit.dto.request.CostumeCreateRequest;
import com.aurafit.dto.request.CostumeItemCreateRequest;
import com.aurafit.dto.request.CostumeItemUpdateRequest;
import com.aurafit.dto.request.CostumeUpdateRequest;
import com.aurafit.dto.response.AdminCostumeDTO;
import com.aurafit.dto.response.CostumeItemDTO;

import java.util.List;

public interface AdminService {

    com.aurafit.dto.response.PaginatedResponse<AdminCostumeDTO> getAllCostumes(String authenticatedEmail, int pageNo, int pageSize, String sortBy, String sortDir, String keyword, String status, Long categoryId);

    AdminCostumeDTO createCostume(CostumeCreateRequest request, String authenticatedEmail);

    AdminCostumeDTO updateCostume(Long id, CostumeUpdateRequest request, String authenticatedEmail);

    // --- CostumeItem management ---

    List<CostumeItemDTO> getItemsByCostumeId(Long costumeId, String authenticatedEmail);

    CostumeItemDTO createCostumeItem(Long costumeId, CostumeItemCreateRequest request, String authenticatedEmail);

    CostumeItemDTO updateCostumeItem(Long costumeId, Long itemId, CostumeItemUpdateRequest request, String authenticatedEmail);

    void deleteCostumeItem(Long costumeId, Long itemId, String authenticatedEmail);
}
