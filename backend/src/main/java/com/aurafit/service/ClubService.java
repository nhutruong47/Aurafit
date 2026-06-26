package com.aurafit.service;

import com.aurafit.dto.request.ClubCreateRequest;
import com.aurafit.dto.request.ClubUpdateRequest;
import com.aurafit.dto.response.ClubDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.enums.ClubStatus;

public interface ClubService {

    ClubDTO createClub(ClubCreateRequest request);

    ClubDTO updateClub(Long id, ClubUpdateRequest request);

    void deleteClub(Long id);

    ClubDTO getClubById(Long id);

    PaginatedResponse<ClubDTO> searchClubs(String keyword, ClubStatus status, Double minDiscountRate,
                                           int pageNo, int pageSize, String sortBy, String sortDir);
}
