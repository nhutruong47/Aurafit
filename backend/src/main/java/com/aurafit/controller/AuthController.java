package com.aurafit.controller;

import com.aurafit.dto.request.OtpRequestDTO;
import com.aurafit.dto.request.VerifyOtpRequestDTO;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.AuthResponseDTO;
import com.aurafit.dto.response.OtpSentResponse;
import com.aurafit.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/register")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Step 1 — Request OTP.
     *
     * POST /api/auth/register/request-otp
     * Body: { "email": "user@example.com" }
     *
     * Checks for email duplicates, generates a 6-digit OTP, stores it with 5-min TTL
     * in the ConcurrentHashMap cache, and sends it via Gmail SMTP.
     */
    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse<OtpSentResponse>> requestOtp(
            @Valid @RequestBody OtpRequestDTO request) {

        OtpSentResponse result = authService.requestOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Gui ma OTP thanh cong.", result));
    }

    /**
     * Step 2 — Verify OTP & Register.
     *
     * POST /api/auth/register/verify-otp
     * Body: { "email": "...", "otpCode": "...", "fullName": "...", "phone": "...", "password": "..." }
     *
     * Verifies the OTP from the in-memory cache. On success, removes the entry,
     * encodes the password with BCrypt, creates the User with emailVerified = true,
     * persists it to the database, and returns a full JWT auth response.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequestDTO request) {

        AuthResponseDTO result = authService.verifyOtpAndRegister(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dang ky tai khoan thanh cong!", result));
    }
}
