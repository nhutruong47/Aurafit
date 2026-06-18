package com.aurafit.controller;

import com.aurafit.dto.response.CategoryDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.service.CostumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/catalog")
@Tag(name = "Public Catalog", description = "Public endpoints for browsing costumes and categories — no authentication required")
public class PublicCatalogController {

    private final CostumeService costumeService;

    public PublicCatalogController(CostumeService costumeService) {
        this.costumeService = costumeService;
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all categories",
            description = "Returns all costume categories for sidebar filters")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(costumeService.getAllCategories());
    }

    @GetMapping("/costumes")
    @Operation(summary = "Browse costumes with pagination and filters",
            description = "Returns a paginated list of ACTIVE costumes. Supports optional filtering by category and keyword search on costume name.")
    public ResponseEntity<PaginatedResponse<CostumeDTO>> getAllCostumes(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "12") int pageSize,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        PaginatedResponse<CostumeDTO> response = costumeService.getAllActiveCostumes(
                categoryId, keyword, pageNo, pageSize, sortBy, sortDir
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/costumes/{id}")
    @Operation(summary = "Get costume details",
            description = "Returns a single costume by ID. Returns 404 if not found.")
    public ResponseEntity<CostumeDTO> getCostumeById(@PathVariable Long id) {
        return ResponseEntity.ok(costumeService.getCostumeById(id));
    }
}
