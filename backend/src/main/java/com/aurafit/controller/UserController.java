package com.aurafit.controller;

import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.response.AuthResponse;
import com.aurafit.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới cho Khách hàng", description = "Tự động mã hóa mật khẩu và tạo role CUSTOMER")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống (Dual Token)", description = "Access Token trả về Body JSON (Memory). Refresh Token tự nhét ngầm vào HttpOnly Cookie")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        return ResponseEntity.ok(userService.login(request, response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Cấp lại Access Token mới", description = "Đọc HttpOnly Cookie từ Request để tự động gia hạn Access Token lên Memory")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        return ResponseEntity.ok(userService.refresh(request));
    }
}