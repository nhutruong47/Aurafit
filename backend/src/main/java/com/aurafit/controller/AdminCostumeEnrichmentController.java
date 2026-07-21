package com.aurafit.controller;

import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.EnrichmentBatchResponse;
import com.aurafit.service.EnrichmentBatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/costumes/enrichment")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Costume Enrichment", description = "Manual AI enrichment for the active costume catalog")
public class AdminCostumeEnrichmentController {

    private final EnrichmentBatchService enrichmentBatchService;

    public AdminCostumeEnrichmentController(EnrichmentBatchService enrichmentBatchService) {
        this.enrichmentBatchService = enrichmentBatchService;
    }

    @PostMapping("/run")
    @Operation(summary = "Run AI metadata and embedding enrichment for all active costumes")
    public ResponseEntity<ApiResponse<EnrichmentBatchResponse>> run() {
        EnrichmentBatchResponse result = enrichmentBatchService.run();
        return ResponseEntity.ok(ApiResponse.success(
                "Costume enrichment batch completed.",
                result
        ));
    }
}
