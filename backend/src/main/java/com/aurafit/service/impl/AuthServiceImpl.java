package com.aurafit.service.impl;

import com.aurafit.service.AuthService;
import com.aurafit.service.EmailService;
import com.aurafit.service.OtpService;import com.aurafit.dto.request.OtpRequestDTO;
import com.aurafit.dto.request.VerifyOtpRequestDTO;
import com.aurafit.dto.response.AuthResponseDTO;
import com.aurafit.dto.response.OtpSentResponse;
import com.aurafit.dto.response.UserResponseDTO;
import com.aurafit.entity.OtpVerification;
import com.aurafit.entity.User;
import com.aurafit.exception.ConflictException;
import com.aurafit.repository.UserRepository;
import com.aurafit.security.CustomUserDetailsService;
import com.aurafit.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    public AuthServiceImpl(UserRepository userRepository,
                       OtpService otpService,
                       EmailService emailService,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       CustomUserDetailsService customUserDetailsService) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customUserDetailsService = customUserDetailsService;
    }

    // -------------------------------------------------------------------------
    // Step 1 — Register & Request OTP (single combined call)
    // -------------------------------------------------------------------------

    /**
     * Persists the full registration payload into the OTP cache, generates an
     * OTP, and dispatches it via Gmail SMTP. The user is not yet committed to
     * the database — that happens in Step 2 after the OTP is verified.
     *
     * @param request contains email, fullName, phone, password
     * @return a lightweight response confirming dispatch
     * @throws ConflictException if the email is not Gmail, or is already
     *                           registered and verified
     */
    @Transactional
    public OtpSentResponse requestOtp(OtpRequestDTO request) {
        if (!isGmail(request.email())) {
            throw new ConflictException("Chỉ email Gmail cần xác thực OTP.");
        }
        if (userRepository.existsByEmailAndEmailVerifiedTrue(request.email())) {
            throw new ConflictException("Email này đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.");
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        otpService.store(request.email(), request.fullName(), request.phone(), hashedPassword);
        OtpVerification entry = otpService.getValidEntry(request.email());
        emailService.sendOtpEmail(request.email(), entry.getOtpCode());

        return new OtpSentResponse(LocalDateTime.now(), "Mã xác thực đã được gửi đến email của bạn.");
    }

    // -------------------------------------------------------------------------
    // Step 2 — Verify OTP & Finalize Registration
    // -------------------------------------------------------------------------

    /**
     * Verifies the OTP from the cache. The registration payload (full name,
     * phone, hashed password) is also read from the same cache entry so the
     * user is finally persisted with emailVerified = true.
     *
     * @param request contains email and otpCode
     * @return AuthResponseDTO with accessToken, refreshToken, and user data
     */
    @Transactional
    public AuthResponseDTO verifyOtpAndRegister(VerifyOtpRequestDTO request) {
        otpService.verify(request.email(), request.otpCode());
        OtpVerification entry = otpService.getValidEntry(request.email());

        if (userRepository.existsByEmailAndEmailVerifiedTrue(request.email())) {
            throw new ConflictException("Email này đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.");
        }

        User user = userRepository.findByEmail(request.email()).orElseGet(User::new);
        user.setEmail(request.email());
        user.setFullName(entry.getFullName());
        user.setPhone(entry.getPhone());
        user.setPasswordHash(entry.getPasswordHash());
        user.setEmailVerified(true);

        User savedUser = userRepository.save(user);
        otpService.remove(request.email());

        return buildAuthResponse(savedUser);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static boolean isGmail(String email) {
        return email != null && email.toLowerCase().endsWith("@gmail.com");
    }

    private AuthResponseDTO buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateToken(
                user.getEmail(), user.getId(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(
                user.getEmail(), user.getId(), user.getRole().name());

        UserResponseDTO userDTO = new UserResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getRole(),
                user.getStatus()
        );

        return new AuthResponseDTO(accessToken, refreshToken, userDTO);
    }
}
