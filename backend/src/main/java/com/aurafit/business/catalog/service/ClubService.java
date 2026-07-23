package com.aurafit.business.catalog.service;

import com.aurafit.business.catalog.dto.request.ClubCreateRequest;
import com.aurafit.business.catalog.dto.request.ClubUpdateRequest;
import com.aurafit.business.catalog.dto.response.ClubDTO;
import com.aurafit.common.dto.response.PaginatedResponse;
import com.aurafit.business.catalog.enums.ClubStatus;

public interface ClubService {

    ClubDTO createClub(ClubCreateRequest request);

    ClubDTO updateClub(Long id, ClubUpdateRequest request);

    void deleteClub(Long id);

    ClubDTO getClubById(Long id);

    PaginatedResponse<ClubDTO> searchClubs(String keyword, ClubStatus status, Double minDiscountRate,
                                           int pageNo, int pageSize, String sortBy, String sortDir);
}
