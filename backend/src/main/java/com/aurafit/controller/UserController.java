package com.aurafit.controller;

import com.aurafit.dto.request.UserRoleUpdateRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.UserResponseDTO;
import com.aurafit.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * User profile management endpoints.
 * Authentication concerns (login, register, refresh, OTP) have been
 * consolidated into {@link AuthController} under /api/auth.
 *
 * Future endpoints:
 *  - GET  /api/users/me          → get authenticated user's profile
 *  - PUT  /api/users/me          → update profile
 *  - PUT  /api/users/me/password → change password
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "User profile management (future)")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponseDTO>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully.", userService.getAllUsers()));
    }

    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody UserRoleUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully.", userService.updateUserRole(userId, request.role())));
    }
}
