package com.aurafit.controller;

import com.aurafit.dto.request.ChangePasswordRequestDTO;
import com.aurafit.dto.request.StaffCreateRequest;
import com.aurafit.dto.request.UpdateProfileRequestDTO;
import com.aurafit.dto.request.UserStatusUpdateRequest;

import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.StaffAccountResponseDTO;
import com.aurafit.dto.response.UserResponseDTO;
import com.aurafit.service.UserService;
import com.aurafit.enums.Role;
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
    public ResponseEntity<ApiResponse<com.aurafit.dto.response.PaginatedResponse<UserResponseDTO>>> getAllUsers(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int pageNo,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int pageSize,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "id") String sortBy,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "desc") String sortDir,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String keyword,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Role role
    ) {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully.", userService.getAllUsers(pageNo, pageSize, sortBy, sortDir, keyword, role)));
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

    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserStatusUpdateRequest request
    ) {
        UserResponseDTO updatedUser = userService.updateUserStatus(userId, request.status());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái tài khoản thành công.", updatedUser));
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
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công.", org.springframework.http.HttpStatus.OK));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private Long extractUserId(org.springframework.security.core.userdetails.UserDetails principal) {
        return userService.getUserIdByEmail(principal.getUsername());
    }
}
