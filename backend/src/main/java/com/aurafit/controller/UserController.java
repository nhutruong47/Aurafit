package com.aurafit.controller;

import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.AuthResponse;
import com.aurafit.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    @Operation(summary = "Dang ky tai khoan moi cho khach hang",
            description = "Ma hoa mat khau va tao tai khoan mac dinh voi role CUSTOMER")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dang ky tai khoan thanh cong.", HttpStatus.CREATED));
    }

    @PostMapping("/login")
    @Operation(summary = "Dang nhap he thong",
            description = "Tra ve access token trong body va ghi refresh token vao HttpOnly cookie")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request,
            HttpServletResponse response) {
        return ResponseEntity.ok(ApiResponse.success("Dang nhap thanh cong.", userService.login(request, response)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Cap lai access token",
            description = "Doc refresh token tu cookie de cap access token moi")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(HttpServletRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lam moi access token thanh cong.", userService.refresh(request)));
    }
}
