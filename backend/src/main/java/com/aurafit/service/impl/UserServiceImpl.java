package com.aurafit.service.impl;

import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.request.StaffCreateRequest;
import com.aurafit.dto.response.AuthResponseDTO;
import com.aurafit.dto.response.StaffAccountResponseDTO;
import com.aurafit.dto.response.UserResponseDTO;
import com.aurafit.entity.User;
import com.aurafit.enums.Role;
import com.aurafit.enums.UserStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ConflictException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.exception.UnauthorizedException;
import com.aurafit.repository.UserRepository;
import com.aurafit.security.CustomUserDetailsService;
import com.aurafit.security.JwtTokenProvider;
import com.aurafit.service.UserService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    public UserServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            CustomUserDetailsService customUserDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email nay da duoc su dung.");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
    }

    @Override
    public AuthResponseDTO login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Sai tai khoan hoac mat khau."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Sai tai khoan hoac mat khau.");
        }

        return buildAuthResponse(user);
    }

    @Override
    public AuthResponseDTO refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Phien lam viec da het han hoac khong hop le, vui long dang nhap lai.");
        }

        String email = jwtTokenProvider.extractUsername(refreshToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

        if (!jwtTokenProvider.validateToken(refreshToken, userDetails)) {
            throw new UnauthorizedException("Ma xac thuc khong hop le, vui long dang nhap lai.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung hop le."));

        return buildAuthResponse(user);
    }

    @Override
    public Long getUserIdByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }

    @Override
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAllByOrderByIdDesc().stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserResponseDTO updateUserRole(Long userId, Role role) {
        if (role != Role.CUSTOMER && role != Role.SELLER) {
            throw new BadRequestException("Admin chi duoc cap hoac thu hoi quyen SELLER cho tai khoan ban hang.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != Role.CUSTOMER && user.getRole() != Role.SELLER) {
            throw new BadRequestException("Chi co the cap hoac thu hoi quyen SELLER cho tai khoan CUSTOMER/SELLER.");
        }

        user.setRole(role);
        return toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public StaffAccountResponseDTO createStaffAccount(StaffCreateRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email nay da duoc su dung.");
        }

        String temporaryPassword = request.temporaryPassword();
        if (temporaryPassword == null || temporaryPassword.isBlank()) {
            temporaryPassword = "Staff@12345";
        }

        User staff = new User();
        staff.setFullName(request.fullName());
        staff.setEmail(request.email());
        staff.setPhone(request.phone());
        staff.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        staff.setRole(Role.STAFF);
        staff.setStatus(request.status() == null ? UserStatus.ACTIVE : request.status());
        staff.setEmailVerified(true);

        return StaffAccountResponseDTO.fromEntity(userRepository.save(staff));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private AuthResponseDTO buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateToken(
                user.getEmail(), user.getId(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(
                user.getEmail(), user.getId(), user.getRole().name());

        UserResponseDTO userDTO = toUserResponse(user);

        return new AuthResponseDTO(accessToken, refreshToken, userDTO);
    }

    private UserResponseDTO toUserResponse(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus()
        );
    }
}
