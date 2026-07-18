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
                .orElseThrow(() -> new BadCredentialsException("Tài khoản hoặc mật khẩu không chính xác."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Tài khoản hoặc mật khẩu không chính xác.");
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new UnauthorizedException("Tài khoản của bạn hiện đang bị khóa.");
        }

        return buildAuthResponse(user);
    }

    @Override
    public AuthResponseDTO refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Phiên làm việc không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại.");
        }

        String email = jwtTokenProvider.extractUsername(refreshToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

        if (!jwtTokenProvider.validateToken(refreshToken, userDetails)) {
            throw new UnauthorizedException("Mã xác thực không hợp lệ, vui lòng đăng nhập lại.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại trong hệ thống."));

        return buildAuthResponse(user);
    }

    @Override
    public Long getUserIdByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }

    @Override
    public com.aurafit.dto.response.PaginatedResponse<UserResponseDTO> getAllUsers(
            int pageNo,
            int pageSize,
            String sortBy,
            String sortDir,
            String keyword,
            Role role
    ) {
        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase(org.springframework.data.domain.Sort.Direction.ASC.name())
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(pageNo, pageSize, sort);

        org.springframework.data.domain.Page<User> page;
        if (role != null && keyword != null && !keyword.isBlank()) {
            page = userRepository.searchUsersByRole(role, keyword.trim(), pageable);
        } else if (role != null) {
            page = userRepository.findByRole(role, pageable);
        } else if (keyword != null && !keyword.isBlank()) {
            page = userRepository.searchUsers(keyword, pageable);
        } else {
            page = userRepository.findAll(pageable);
        }

        List<UserResponseDTO> content = page.getContent().stream()
                .map(this::toUserResponse)
                .toList();

        return new com.aurafit.dto.response.PaginatedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
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

    @Override
    @Transactional
    public UserResponseDTO updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Không thể thay đổi trạng thái tài khoản admin.");
        }

        if (user.getStatus() != status) {
            user.setStatus(status);
            userRepository.save(user);
        }

        return toUserResponse(user);
    }

    // -------------------------------------------------------------------------
    // Profile management
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public UserResponseDTO updateProfile(Long userId, com.aurafit.dto.request.UpdateProfileRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setFullName(request.fullName());
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.address() != null) {
            user.setAddress(request.address());
        }

        return toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void changePassword(Long userId, com.aurafit.dto.request.ChangePasswordRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu cũ không chính xác.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
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
                user.getPhone(),
                user.getAddress(),
                user.getRole(),
                user.getStatus()
        );
    }
}
