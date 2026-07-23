package com.aurafit.business.interaction.controller;

import com.aurafit.business.interaction.dto.request.AttachInteractionSessionRequest;
import com.aurafit.business.interaction.dto.request.TrackInteractionRequest;
import com.aurafit.common.dto.response.ApiResponse;
import com.aurafit.business.interaction.dto.response.InteractionSessionAttachResponse;
import com.aurafit.business.interaction.service.UserInteractionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interactions")
@Tag(name = "Interactions", description = "User and guest interaction tracking endpoints")
public class InteractionController {

    private final UserInteractionService userInteractionService;

    public InteractionController(UserInteractionService userInteractionService) {
        this.userInteractionService = userInteractionService;
    }

    @PostMapping
    @Operation(summary = "Track a user or guest interaction")
    public ResponseEntity<ApiResponse<Void>> trackInteraction(
            Authentication authentication,
            @Valid @RequestBody TrackInteractionRequest request
    ) {
        userInteractionService.track(request, authentication != null ? authentication.getName() : null);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Interaction tracked successfully.", HttpStatus.ACCEPTED));
    }

    @PostMapping("/sessions/attach")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Attach a guest session's interaction history to the authenticated user")
    public ResponseEntity<ApiResponse<InteractionSessionAttachResponse>> attachSession(
            Authentication authentication,
            @Valid @RequestBody AttachInteractionSessionRequest request
    ) {
        int mergedCount = userInteractionService.attachSessionToUser(request.sessionId(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                "Interaction session attached successfully.",
                new InteractionSessionAttachResponse(request.sessionId(), mergedCount)
        ));
    }
}
