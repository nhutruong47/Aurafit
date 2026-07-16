package com.aurafit.service;

import com.aurafit.dto.response.CatalogCostumeDTO;
import com.aurafit.dto.response.CategoryDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.PaginatedResponse;

import java.util.List;

public interface CostumeService {

    /**
     * Fetches a paginated, filtered list of ACTIVE costumes for the public catalog.
     *
     * @param categoryId Optional filter by category id. Pass null to skip.
     * @param categoryPath Optional filter by category path. Pass null to skip.
     * @param keyword    Optional search term matched against costume name. Pass null to skip.
     * @param pageNo     Zero-based page index.
     * @param pageSize   Number of items per page.
     * @param sortBy     Field to sort by (e.g. "rentalPrice", "name", "createdAt").
     * @param sortDir    Sort direction: "asc" or "desc".
     * @return A paginated response containing CostumeDTOs.
     */
    PaginatedResponse<CatalogCostumeDTO> getAllActiveCostumes(Long categoryId, String categoryPath, String keyword,
                                                       int pageNo, int pageSize,
                                                       String sortBy, String sortDir, Long userId);

    /**
     * Fetches a single costume by ID. Throws ResourceNotFoundException if not found.
     *
     * @param id The costume ID.
     * @return The CostumeDTO.
     */
    CostumeDTO getCostumeById(Long id, Long userId);

    /**
     * Fetches all categories for sidebar/filter UI.
     *
     * @return A list of CategoryDTOs.
     */
    List<CategoryDTO> getAllCategories();

    /**
     * Fetches seasonal / featured costumes for the homepage banner.
     *
     * @param limit Number of costumes to return.
     * @return A list of CatalogCostumeDTOs, sorted by popularity.
     */
    List<CatalogCostumeDTO> getSeasonalCostumes(int limit);

    /**
     * Fetches personalized recommendations for a user.
     *
     * @param userId The user ID (nullable for anonymous users).
     * @param limit  Number of recommendations to return.
     * @return A list of CatalogCostumeDTOs.
     */
    List<CatalogCostumeDTO> getRecommendedCostumes(Long userId, int limit);
}
