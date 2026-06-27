package com.aurafit.controller;

import com.aurafit.dto.request.AttachAiStylistSessionRequest;
import com.aurafit.dto.request.CreateAiStylistSessionRequest;
import com.aurafit.dto.request.SendAiStylistMessageRequest;
import com.aurafit.dto.response.AiStylistSessionAttachResponse;
import com.aurafit.dto.response.AiStylistSessionDTO;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.service.AiStylistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-stylist")
@Tag(name = "AI Stylist", description = "Catalog-grounded AI stylist conversation endpoints")
public class AiStylistController {

    private final AiStylistService aiStylistService;

    public AiStylistController(AiStylistService aiStylistService) {
        this.aiStylistService = aiStylistService;
    }

    @PostMapping("/sessions")
    @Operation(summary = "Create an AI Stylist session")
    public ResponseEntity<ApiResponse<AiStylistSessionDTO>> createSession(
            Authentication authentication,
            @RequestBody CreateAiStylistSessionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "AI Stylist session created successfully.",
                        aiStylistService.createSession(request, resolveAuthenticatedEmail(authentication)),
                        HttpStatus.CREATED
                ));
    }

    @GetMapping("/sessions/{sessionId}")
    @Operation(summary = "Get an AI Stylist session")
    public ResponseEntity<ApiResponse<AiStylistSessionDTO>> getSession(
            @PathVariable Long sessionId,
            @RequestParam(required = false) String guestSessionId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "AI Stylist session retrieved successfully.",
                aiStylistService.getSession(sessionId, guestSessionId, resolveAuthenticatedEmail(authentication))
        ));
    }

    @PostMapping("/messages")
    @Operation(summary = "Send a message to AI Stylist")
    public ResponseEntity<ApiResponse<AiStylistSessionDTO>> sendMessage(
            Authentication authentication,
            @Valid @RequestBody SendAiStylistMessageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "AI Stylist replied successfully.",
                aiStylistService.sendMessage(request, resolveAuthenticatedEmail(authentication))
        ));
    }

    @PostMapping("/sessions/attach")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Attach guest AI Stylist sessions to the authenticated user")
    public ResponseEntity<ApiResponse<AiStylistSessionAttachResponse>> attachGuestSessions(
            Authentication authentication,
            @Valid @RequestBody AttachAiStylistSessionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "AI Stylist guest sessions attached successfully.",
                aiStylistService.attachGuestSessionsToUser(
                        request.guestSessionId(),
                        request.preferredSessionId(),
                        resolveAuthenticatedEmail(authentication)
                )
        ));
    }

    private String resolveAuthenticatedEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        return authentication.getName();
    }
}
