package com.aurafit.controller;

import com.aurafit.dto.request.ClubCreateRequest;
import com.aurafit.dto.request.ClubUpdateRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.ClubDTO;
import com.aurafit.dto.response.PaginatedResponse;
import com.aurafit.enums.ClubStatus;
import com.aurafit.service.ClubService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clubs")
@Tag(name = "Club", description = "Club management endpoints")
public class ClubController {

    private final ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }

    @GetMapping
    @Operation(summary = "Search and list clubs", description = "Returns a paginated list of clubs with optional search filters")
    public ResponseEntity<ApiResponse<PaginatedResponse<ClubDTO>>> searchClubs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ClubStatus status,
            @RequestParam(required = false) Double minDiscountRate,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        PaginatedResponse<ClubDTO> response = clubService.searchClubs(
                keyword, status, minDiscountRate, pageNo, pageSize, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.success("Clubs retrieved successfully.", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get club by ID", description = "Returns detailed club information by ID")
    public ResponseEntity<ApiResponse<ClubDTO>> getClubById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Club retrieved successfully.", clubService.getClubById(id)));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new club (Admin)")
    public ResponseEntity<ApiResponse<ClubDTO>> createClub(@Valid @RequestBody ClubCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Club created successfully.", clubService.createClub(request), HttpStatus.CREATED));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing club (Admin)")
    public ResponseEntity<ApiResponse<ClubDTO>> updateClub(
            @PathVariable Long id,
            @Valid @RequestBody ClubUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Club updated successfully.", clubService.updateClub(id, request)));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an existing club (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteClub(@PathVariable Long id) {
        clubService.deleteClub(id);
        return ResponseEntity.ok(ApiResponse.success("Club deleted successfully.", HttpStatus.OK));
    }
}
