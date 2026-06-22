package com.aurafit.controller;

import com.aurafit.dto.response.CategoryDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.service.CostumeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CostumeService costumeService;

    public CatalogController(CostumeService costumeService) {
        this.costumeService = costumeService;
    }

    @GetMapping("/costumes")
    public ResponseEntity<PaginatedResponse<CostumeDTO>> getAllCostumes(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "12") int pageSize,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Long categoryId = null;
        if (category != null && !category.isEmpty()) {
            try {
                categoryId = Long.parseLong(category);
            } catch (NumberFormatException ignored) {
            }
        }
        PaginatedResponse<CostumeDTO> response = costumeService.getAllActiveCostumes(
                categoryId, keyword, pageNo, pageSize, sortBy, sortDir
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/costumes/{id}")
    public ResponseEntity<CostumeDTO> getCostumeById(@PathVariable Long id) {
        return ResponseEntity.ok(costumeService.getCostumeById(id));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(costumeService.getAllCategories());
    }

    @GetMapping("/costumes/seasonal")
    public ResponseEntity<List<CostumeDTO>> getSeasonalCostumes() {
        return ResponseEntity.ok(costumeService.getSeasonalCostumes(8));
    }

    @GetMapping("/costumes/recommendations")
    public ResponseEntity<List<CostumeDTO>> getRecommendedCostumes(
            @RequestParam(required = false) Long userId
    ) {
        return ResponseEntity.ok(costumeService.getRecommendedCostumes(userId, 6));
    }
}
