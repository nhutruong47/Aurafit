package com.aurafit.service;

import com.aurafit.dto.request.OtpRequestDTO;
import com.aurafit.dto.request.VerifyOtpRequestDTO;
import com.aurafit.dto.response.AuthResponseDTO;
import com.aurafit.dto.response.OtpSentResponse;
import com.aurafit.dto.response.UserResponseDTO;
import com.aurafit.entity.User;
import com.aurafit.exception.ConflictException;
import com.aurafit.entity.OtpEntry;
import com.aurafit.repository.UserRepository;
import com.aurafit.security.CustomUserDetailsService;
import com.aurafit.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    public AuthService(UserRepository userRepository,
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
    // Step 1 — Request OTP
    // -------------------------------------------------------------------------

    /**
     * Checks that the email is a Gmail address and is not already registered/verified,
     * generates an OTP, stores it in the in-memory cache, and dispatches it via Gmail SMTP.
     *
     * @param request contains only the email address
     * @return a lightweight response confirming dispatch
     * @throws ConflictException if the email is not Gmail, or is already registered and verified
     */
    @Transactional(readOnly = true)
    public OtpSentResponse requestOtp(OtpRequestDTO request) {
        if (!isGmail(request.email())) {
            throw new ConflictException("Chi email Gmail can xac thuc OTP.");
        }
        if (userRepository.existsByEmailAndEmailVerifiedTrue(request.email())) {
            throw new ConflictException("Email nay da duoc su dung. Vui long su dung email khac.");
        }

        otpService.store(request.email());
        OtpEntry entry = otpService.getValidEntry(request.email());
        emailService.sendOtpEmail(request.email(), entry.getOtpCode());

        return new OtpSentResponse(LocalDateTime.now(), "Ma xac thuc da duoc gui den email cua ban.");
    }

    // -------------------------------------------------------------------------
    // Step 2 — Verify OTP & Register
    // -------------------------------------------------------------------------

    /**
     * Verifies the OTP from the cache, removes it, encodes the password with BCrypt,
     * creates the User entity with emailVerified = true, persists it, and returns
     * a full AuthResponse (access + refresh JWT).
     *
     * @param request contains email, otpCode, fullName, phone, password
     * @return AuthResponseDTO with accessToken, refreshToken, and user data
     */
    @Transactional
    public AuthResponseDTO verifyOtpAndRegister(VerifyOtpRequestDTO request) {
        otpService.verify(request.email(), request.otpCode());

        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user != null && Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ConflictException("Email nay da duoc su dung. Vui long su dung email khac.");
        }

        if (user != null) {
            user.setFullName(request.fullName());
            user.setPhone(request.phone());
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            user.setEmailVerified(true);
        } else {
            user = new User();
            user.setFullName(request.fullName());
            user.setEmail(request.email());
            user.setPhone(request.phone());
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            user.setEmailVerified(true);
        }

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
                user.getRole(),
                user.getStatus()
        );

        return new AuthResponseDTO(accessToken, refreshToken, userDTO);
    }
}
