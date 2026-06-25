package com.aurafit.controller;

import com.aurafit.dto.request.FashionTrendUpsertRequest;
import com.aurafit.dto.request.UpsertProductAiMetadataRequest;
import com.aurafit.dto.response.FashionTrendResponse;
import com.aurafit.dto.response.ProductAiMetadataResponse;
import com.aurafit.service.AiAdminService;
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
@RequestMapping("/api/admin")
@Tag(name = "Admin AI Recommendation", description = "Admin endpoints for AI metadata and fashion trends")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiController {

    private final AiAdminService aiAdminService;

    public AdminAiController(AiAdminService aiAdminService) {
        this.aiAdminService = aiAdminService;
    }

    @GetMapping("/costumes/{costumeId}/ai-metadata")
    public ResponseEntity<ProductAiMetadataResponse> getCostumeMetadata(@PathVariable Long costumeId) {
        return ResponseEntity.ok(aiAdminService.getProductMetadata(costumeId));
    }

    @PutMapping("/costumes/{costumeId}/ai-metadata")
    public ResponseEntity<ProductAiMetadataResponse> upsertCostumeMetadata(
            @PathVariable Long costumeId,
            @RequestBody UpsertProductAiMetadataRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(aiAdminService.upsertProductMetadata(costumeId, request, authentication.getName()));
    }

    @GetMapping("/fashion-trends")
    public ResponseEntity<List<FashionTrendResponse>> getFashionTrends() {
        return ResponseEntity.ok(aiAdminService.getFashionTrends());
    }

    @PostMapping("/fashion-trends")
    public ResponseEntity<FashionTrendResponse> createFashionTrend(
            @Valid @RequestBody FashionTrendUpsertRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(aiAdminService.createFashionTrend(request, authentication.getName()));
    }

    @PutMapping("/fashion-trends/{trendId}")
    public ResponseEntity<FashionTrendResponse> updateFashionTrend(
            @PathVariable Long trendId,
            @Valid @RequestBody FashionTrendUpsertRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(aiAdminService.updateFashionTrend(trendId, request, authentication.getName()));
    }
}
