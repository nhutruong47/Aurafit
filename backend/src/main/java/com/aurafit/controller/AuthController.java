package com.aurafit.controller;

import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.OtpRequestDTO;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.request.VerifyOtpRequestDTO;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.AuthResponseDTO;
import com.aurafit.dto.response.OtpSentResponse;
import com.aurafit.exception.UnauthorizedException;
import com.aurafit.service.AuthService;
import com.aurafit.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Registration, login, OTP, and session management")
public class AuthController {

    private static final Duration REFRESH_COOKIE_MAX_AGE = Duration.ofDays(7);

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    // ── Registration ─────────────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Register a new customer account",
            description = "Gmail addresses require OTP verification first. Other emails are registered directly.")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest request) {
        boolean isGmail = request.getEmail() != null
                && request.getEmail().toLowerCase().endsWith("@gmail.com");

        if (isGmail) {
            OtpSentResponse result = authService.requestOtp(
                    new OtpRequestDTO(
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

    // ── OTP Flow ─────────────────────────────────────────────────────────

    /**
     * Step 1 — Request OTP.
     * POST /api/auth/register/request-otp
     */
    @PostMapping("/register/request-otp")
    @Operation(summary = "Request an OTP code for Gmail registration")
    public ResponseEntity<ApiResponse<OtpSentResponse>> requestOtp(
            @Valid @RequestBody OtpRequestDTO request) {

        OtpSentResponse result = authService.requestOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Gui ma OTP thanh cong.", result));
    }

    /**
     * Step 2 — Verify OTP & Register.
     * POST /api/auth/register/verify-otp
     */
    @PostMapping("/register/verify-otp")
    @Operation(summary = "Verify OTP and complete registration")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequestDTO request) {

        AuthResponseDTO result = authService.verifyOtpAndRegister(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dang ky tai khoan thanh cong!", result));
    }

    // ── Login & Session ──────────────────────────────────────────────────

    @PostMapping("/login")
    @Operation(summary = "Login",
            description = "Returns access token in body and writes refresh token to HttpOnly cookie")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponseDTO authResponse = userService.login(request);
        ResponseCookie cookie = buildRefreshCookie(authResponse.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Dang nhap thanh cong.", authResponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token",
            description = "Reads refresh token from HttpOnly cookie and issues a new access token")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> refresh(HttpServletRequest request) {
        String refreshToken = extractRefreshTokenFromCookies(request);
        AuthResponseDTO authResponse = userService.refresh(refreshToken);
        ResponseCookie cookie = buildRefreshCookie(authResponse.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Lam moi access token thanh cong.", authResponse));
    }

    // ── Private helpers ──────────────────────────────────────────────────

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
