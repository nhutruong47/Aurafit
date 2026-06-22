package com.aurafit.service;

import com.aurafit.dto.request.CostumeCreateRequest;
import com.aurafit.dto.request.CostumeUpdateRequest;
import com.aurafit.dto.response.AdminCostumeDTO;

import java.util.List;

public interface AdminService {

    List<AdminCostumeDTO> getAllCostumes();

    AdminCostumeDTO createCostume(CostumeCreateRequest request);

    AdminCostumeDTO updateCostume(Long id, CostumeUpdateRequest request);
}
