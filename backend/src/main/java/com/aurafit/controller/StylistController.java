package com.aurafit.controller;

import com.aurafit.dto.request.ChatMessageRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.ChatMessageResponse;
import com.aurafit.service.UserService;
import com.aurafit.service.stylist.StylistRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stylist")
@Tag(name = "AI Stylist", description = "Public AI-powered costume recommendation endpoints")
public class StylistController {

    private final StylistRecommendationService stylistRecommendationService;
    private final UserService userService;

    public StylistController(
            StylistRecommendationService stylistRecommendationService,
            UserService userService
    ) {
        this.stylistRecommendationService = stylistRecommendationService;
        this.userService = userService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Send a message to the AI stylist")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> chat(
            Authentication authentication,
            @Valid @RequestBody ChatMessageRequest request
    ) {
        Long userId = extractOptionalUserId(authentication);
        ChatMessageResponse response = stylistRecommendationService.handleUserMessage(
                request.sessionId(),
                userId,
                request.message()
        );
        return ResponseEntity.ok(ApiResponse.success("Stylist response generated successfully.", response));
    }

    private Long extractOptionalUserId(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return userService.getUserIdByEmail(authentication.getName());
    }
}
