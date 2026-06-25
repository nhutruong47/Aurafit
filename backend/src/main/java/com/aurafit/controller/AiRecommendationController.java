package com.aurafit.controller;

import com.aurafit.dto.request.OutfitComboRequest;
import com.aurafit.dto.request.RecommendationQueryRequest;
import com.aurafit.dto.response.OutfitComboResponse;
import com.aurafit.dto.response.RecommendationResponse;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AiRecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/recommendations")
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;
    private final UserRepository userRepository;

    public AiRecommendationController(AiRecommendationService aiRecommendationService,
                                      UserRepository userRepository) {
        this.aiRecommendationService = aiRecommendationService;
        this.userRepository = userRepository;
    }

    @PostMapping("/query")
    public ResponseEntity<RecommendationResponse> queryRecommendations(
            @RequestBody RecommendationQueryRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(aiRecommendationService.getRecommendationsForQuery(extractOptionalUserId(authentication), request));
    }

    @GetMapping("/me")
    public ResponseEntity<RecommendationResponse> personalized(Authentication authentication,
                                                               @RequestParam(required = false) Integer limit) {
        Long userId = extractRequiredUserId(authentication);
        return ResponseEntity.ok(aiRecommendationService.getPersonalizedRecommendations(userId, limit));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RecommendationResponse> previewForUser(@PathVariable Long userId,
                                                                 @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(aiRecommendationService.getRecommendationPreview(userId, limit));
    }

    @PostMapping("/outfit-combos")
    public ResponseEntity<OutfitComboResponse> outfitCombos(
            @RequestBody OutfitComboRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(aiRecommendationService.getOutfitCombos(extractOptionalUserId(authentication), request));
    }

    private Long extractRequiredUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }

    private Long extractOptionalUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            return null;
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }
}
