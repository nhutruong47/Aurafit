package com.aurafit.service;

import com.aurafit.dto.request.CostumeCreateRequest;
import com.aurafit.dto.request.CostumeUpdateRequest;
import com.aurafit.dto.response.AdminCostumeDTO;

import java.util.List;

public interface AdminService {

    com.aurafit.dto.response.PaginatedResponse<AdminCostumeDTO> getAllCostumes(String authenticatedEmail, int pageNo, int pageSize, String sortBy, String sortDir, String keyword, String status, Long categoryId);

    AdminCostumeDTO createCostume(CostumeCreateRequest request, String authenticatedEmail);

    AdminCostumeDTO updateCostume(Long id, CostumeUpdateRequest request, String authenticatedEmail);
}
