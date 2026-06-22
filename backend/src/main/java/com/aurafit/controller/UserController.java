package com.aurafit.controller;

import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.AuthResponseDTO;
import com.aurafit.dto.response.OtpSentResponse;
import com.aurafit.exception.UnauthorizedException;
import com.aurafit.service.AuthService;
import com.aurafit.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Duration REFRESH_COOKIE_MAX_AGE = Duration.ofDays(7);

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Dang ky tai khoan moi cho khach hang",
            description = "Email Gmail bat buoc xac thuc OTP. Email khac dang ky truc tiep.")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest request) {
        boolean isGmail = request.getEmail() != null
                && request.getEmail().toLowerCase().endsWith("@gmail.com");

        if (isGmail) {
            OtpSentResponse result = authService.requestOtp(
                    new com.aurafit.dto.request.OtpRequestDTO(
                            request.getEmail(),
                            request.getFullName(),
                            request.getPhone(),
                            request.getPassword()));
            return ResponseEntity.ok(ApiResponse.success(
                    "Email Gmail can xac thuc OTP. Ma xac thuc da duoc gui.", result));
        }

        userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dang ky tai khoan thanh cong.", HttpStatus.CREATED));
    }

    @PostMapping("/login")
    @Operation(summary = "Dang nhap he thong",
            description = "Tra ve access token trong body va ghi refresh token vao HttpOnly cookie")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponseDTO authResponse = userService.login(request);
        ResponseCookie cookie = buildRefreshCookie(authResponse.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Dang nhap thanh cong.", authResponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Cap lai access token",
            description = "Doc refresh token tu cookie de cap access token moi")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> refresh(HttpServletRequest request) {
        String refreshToken = extractRefreshTokenFromCookies(request);
        AuthResponseDTO authResponse = userService.refresh(refreshToken);
        ResponseCookie cookie = buildRefreshCookie(authResponse.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Lam moi access token thanh cong.", authResponse));
    }

    // -------------------------------------------------------------------------
    // Private helpers — HTTP/cookie concerns stay in the Controller layer
    // -------------------------------------------------------------------------

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false)          // false for localhost dev; true in production
                .path("/")
                .maxAge(REFRESH_COOKIE_MAX_AGE)
                .sameSite("Strict")
                .build();
    }

    private String extractRefreshTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        throw new UnauthorizedException("Phien lam viec da het han, vui long dang nhap lai.");
    }
}
