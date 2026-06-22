package com.aurafit.controller;

import com.aurafit.dto.request.CostumeCreateRequest;
import com.aurafit.dto.request.CostumeUpdateRequest;
import com.aurafit.dto.response.AdminCostumeDTO;
import com.aurafit.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/costumes")
@Tag(name = "Admin Costumes", description = "Admin costume management endpoints")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    @Operation(summary = "List all costumes for admin management")
    public ResponseEntity<List<AdminCostumeDTO>> listAllCostumes() {
        return ResponseEntity.ok(adminService.getAllCostumes());
    }

    @PostMapping
    @Operation(summary = "Create a new costume")
    public ResponseEntity<AdminCostumeDTO> createCostume(@Valid @RequestBody CostumeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCostume(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing costume")
    public ResponseEntity<AdminCostumeDTO> updateCostume(
            @PathVariable Long id,
            @Valid @RequestBody CostumeUpdateRequest request
    ) {
        return ResponseEntity.ok(adminService.updateCostume(id, request));
    }
}
