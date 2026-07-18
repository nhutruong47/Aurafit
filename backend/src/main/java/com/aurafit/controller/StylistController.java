package com.aurafit.controller;

import com.aurafit.dto.request.ChatMessageRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.ChatMessageResponse;
import com.aurafit.dto.response.ChatSessionDetailDTO;
import com.aurafit.dto.response.ChatSessionSummaryDTO;
import com.aurafit.exception.AiProviderException;
import com.aurafit.service.UserService;
import com.aurafit.service.stylist.ChatHistoryService;
import com.aurafit.service.stylist.StylistRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stylist")
@Tag(name = "AI Stylist", description = "Public AI-powered costume recommendation endpoints")
public class StylistController {

    private final StylistRecommendationService stylistRecommendationService;
    private final ChatHistoryService chatHistoryService;
    private final UserService userService;

    public StylistController(
            StylistRecommendationService stylistRecommendationService,
            ChatHistoryService chatHistoryService,
            UserService userService
    ) {
        this.stylistRecommendationService = stylistRecommendationService;
        this.chatHistoryService = chatHistoryService;
        this.userService = userService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Send a message to the AI stylist")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> chat(
            Authentication authentication,
            @Valid @RequestBody ChatMessageRequest request
    ) {
        Long userId = extractOptionalUserId(authentication);
        ChatMessageResponse response;
        try {
            response = stylistRecommendationService.handleUserMessage(
                    request.sessionId(),
                    userId,
                    request.message()
            );
        } catch (AiProviderException exception) {
            response = ChatMessageResponse.error(
                    request.sessionId(),
                    exception.getUserFriendlyMessage(),
                    exception.getErrorType().name()
            );
        }
        return ResponseEntity.ok(ApiResponse.success("Stylist response generated successfully.", response));
    }

    @GetMapping("/sessions")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List the authenticated user's stylist chat sessions")
    public ResponseEntity<ApiResponse<List<ChatSessionSummaryDTO>>> getSessions(
            Authentication authentication
    ) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Stylist chat sessions retrieved successfully.",
                chatHistoryService.getSessionsForUser(userId)
        ));
    }

    @GetMapping("/sessions/{sessionId}")
    @Operation(summary = "Get a stylist chat session detail")
    public ResponseEntity<ApiResponse<ChatSessionDetailDTO>> getSessionDetail(
            Authentication authentication,
            @PathVariable String sessionId
    ) {
        Long userId = extractOptionalUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Stylist chat session retrieved successfully.",
                chatHistoryService.getSessionDetail(sessionId, userId)
        ));
    }

    private Long extractUserId(Authentication authentication) {
        return userService.getUserIdByEmail(authentication.getName());
    }

    private Long extractOptionalUserId(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return extractUserId(authentication);
    }
}
