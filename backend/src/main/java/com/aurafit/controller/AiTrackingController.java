package com.aurafit.controller;

import com.aurafit.dto.request.TrackUserBehaviorRequest;
import com.aurafit.dto.response.UserBehaviorTrackResponse;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.BehaviorTrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiTrackingController {

    private final BehaviorTrackingService behaviorTrackingService;
    private final UserRepository userRepository;

    public AiTrackingController(BehaviorTrackingService behaviorTrackingService,
                                UserRepository userRepository) {
        this.behaviorTrackingService = behaviorTrackingService;
        this.userRepository = userRepository;
    }

    @PostMapping("/track")
    public ResponseEntity<UserBehaviorTrackResponse> track(
            @RequestBody TrackUserBehaviorRequest request,
            Authentication authentication
    ) {
        Long authenticatedUserId = extractOptionalUserId(authentication);
        return ResponseEntity.ok(behaviorTrackingService.trackEvent(authenticatedUserId, request));
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
