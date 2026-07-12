package com.aurafit.controller;

import com.aurafit.dto.request.CostumeCreateRequest;
import com.aurafit.dto.request.CostumeUpdateRequest;
import com.aurafit.dto.response.AdminCostumeDTO;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.CostumeItemDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.enums.ItemStatus;
import com.aurafit.service.AdminService;
import com.aurafit.service.CostumeItemService;
import com.aurafit.service.CostumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/costumes")
@Tag(name = "Costume", description = "Costume management and browsing endpoints")
public class CostumeController {

    private final CostumeService costumeService;
    private final AdminService adminService;
    private final CostumeItemService costumeItemService;
    private final com.aurafit.service.UserService userService;

    public CostumeController(CostumeService costumeService, AdminService adminService,
                            CostumeItemService costumeItemService, com.aurafit.service.UserService userService) {
        this.costumeService = costumeService;
        this.adminService = adminService;
        this.costumeItemService = costumeItemService;
        this.userService = userService;
    }

    // --- Public Endpoints ---

    @GetMapping
    @Operation(summary = "Browse costumes", description = "Returns paginated list of ACTIVE costumes")
    public ResponseEntity<ApiResponse<PaginatedResponse<CostumeDTO>>> getAllCostumes(
            Authentication authentication,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String categoryPath,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "12") int pageSize,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Long userId = extractUserIdSafely(authentication);
        PaginatedResponse<CostumeDTO> response = costumeService.getAllActiveCostumes(
                categoryId, categoryPath, keyword, pageNo, pageSize, sortBy, sortDir, userId
        );
        return ResponseEntity.ok(ApiResponse.success("Costumes retrieved successfully.", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get costume details", description = "Returns a single costume by ID")
    public ResponseEntity<ApiResponse<CostumeDTO>> getCostumeById(@PathVariable Long id, Authentication authentication) {
        Long userId = extractUserIdSafely(authentication);
        return ResponseEntity.ok(ApiResponse.success("Costume retrieved successfully.", costumeService.getCostumeById(id, userId)));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "Get available costume items (sizes/colors with SKU) for a costume")
    public ResponseEntity<ApiResponse<List<CostumeItemDTO>>> getCostumeItems(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Costume items retrieved successfully.",
                costumeItemService.getAvailableItemsByCostumeId(id, ItemStatus.AVAILABLE)
        ));
    }

    @GetMapping("/seasonal")
    @Operation(summary = "Get seasonal costumes")
    public ResponseEntity<ApiResponse<List<CostumeDTO>>> getSeasonalCostumes() {
        return ResponseEntity.ok(ApiResponse.success("Seasonal costumes retrieved.", costumeService.getSeasonalCostumes(8)));
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Get recommended costumes")
    public ResponseEntity<ApiResponse<List<CostumeDTO>>> getRecommendedCostumes(
            @RequestParam(required = false) Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Recommended costumes retrieved.", costumeService.getRecommendedCostumes(userId, 6)));
    }

    @GetMapping("/admin")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get manageable costumes", description = "Admin/Staff sees all costumes with pagination")
    public ResponseEntity<ApiResponse<PaginatedResponse<AdminCostumeDTO>>> getAllCostumesForAdmin(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "12") int pageSize,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Manageable costumes retrieved successfully.", adminService.getAllCostumes(authentication.getName(), pageNo, pageSize, sortBy, sortDir, keyword, status, categoryId)));
    }

    // --- Admin Endpoints ---

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Create a new costume (Admin/Staff)")
    public ResponseEntity<ApiResponse<AdminCostumeDTO>> createCostume(
            Authentication authentication,
            @Valid @RequestBody CostumeCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Costume created successfully.", adminService.createCostume(request, authentication.getName()), HttpStatus.CREATED));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Update an existing costume (Admin/Staff)")
    public ResponseEntity<ApiResponse<AdminCostumeDTO>> updateCostume(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CostumeUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Costume updated successfully.", adminService.updateCostume(id, request, authentication.getName())));
    }

    // ── Private helpers ──────────────────────────────────────────────────

    private Long extractUserIdSafely(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        try {
            return userService.getUserIdByEmail(authentication.getName());
        } catch (Exception e) {
            return null;
        }
    }
}
