package com.aurafit.ai.enrichment.controller;

import com.aurafit.common.dto.response.ApiResponse;
import com.aurafit.ai.enrichment.dto.response.CostumeEnrichmentResponse;
import com.aurafit.ai.enrichment.dto.response.EnrichmentBatchResponse;
import com.aurafit.ai.enrichment.service.impl.CostumeEnrichmentAdminService;
import com.aurafit.ai.enrichment.service.impl.EnrichmentBatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/costumes")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Costume Enrichment", description = "Manual AI enrichment for the active costume catalog")
public class AdminCostumeEnrichmentController {

    private final EnrichmentBatchService enrichmentBatchService;
    private final CostumeEnrichmentAdminService costumeEnrichmentAdminService;

    public AdminCostumeEnrichmentController(
            EnrichmentBatchService enrichmentBatchService,
            CostumeEnrichmentAdminService costumeEnrichmentAdminService
    ) {
        this.enrichmentBatchService = enrichmentBatchService;
        this.costumeEnrichmentAdminService = costumeEnrichmentAdminService;
    }

    @PostMapping("/enrichment/run")
    @Operation(summary = "Run AI metadata and embedding enrichment for all active costumes")
    public ResponseEntity<ApiResponse<EnrichmentBatchResponse>> run() {
        EnrichmentBatchResponse result = enrichmentBatchService.run();
        return ResponseEntity.ok(ApiResponse.success(
                "Costume enrichment batch completed.",
                result
        ));
    }

    @PostMapping("/{costumeId}/enrichment/run")
    @Operation(summary = "Run AI metadata and embedding enrichment for one costume")
    public ResponseEntity<ApiResponse<CostumeEnrichmentResponse>> runOne(
            @PathVariable Long costumeId
    ) {
        CostumeEnrichmentResponse result = costumeEnrichmentAdminService.enrichOne(costumeId);
        return ResponseEntity.ok(ApiResponse.success(
                "Costume enrichment completed.",
                result
        ));
    }

    @GetMapping("/{costumeId}/enrichment")
    @Operation(summary = "Get current AI metadata and embedding status for one costume")
    public ResponseEntity<ApiResponse<CostumeEnrichmentResponse>> getOne(
            @PathVariable Long costumeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Costume enrichment loaded.",
                costumeEnrichmentAdminService.getEnrichment(costumeId)
        ));
    }
}
