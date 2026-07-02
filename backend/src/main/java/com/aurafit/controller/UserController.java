package com.aurafit.controller;

import com.aurafit.dto.request.ChangePasswordRequestDTO;
import com.aurafit.dto.request.StaffCreateRequest;
import com.aurafit.dto.request.UpdateProfileRequestDTO;
import com.aurafit.dto.request.UserRoleUpdateRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.StaffAccountResponseDTO;
import com.aurafit.dto.response.UserResponseDTO;
import com.aurafit.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * User profile management endpoints.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "User profile management")
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

    @PostMapping("/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StaffAccountResponseDTO>> createStaffAccount(
            @Valid @RequestBody StaffCreateRequest request
    ) {
        StaffAccountResponseDTO createdStaff = userService.createStaffAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tài khoản staff thành công.", createdStaff));
    }

    // -------------------------------------------------------------------------
    // Profile endpoints (authenticated user)
    // -------------------------------------------------------------------------

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateProfile(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails principal,
            @Valid @RequestBody UpdateProfileRequestDTO request
    ) {
        Long userId = extractUserId(principal);
        UserResponseDTO updated = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công.", updated));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails principal,
            @Valid @RequestBody ChangePasswordRequestDTO request
    ) {
        Long userId = extractUserId(principal);
        userService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công.", null));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private Long extractUserId(org.springframework.security.core.userdetails.UserDetails principal) {
        return userService.getUserIdByEmail(principal.getUsername());
    }
}
