package com.aurafit.service.impl;

import com.aurafit.security.JwtTokenProvider;
import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.response.AuthResponse;
import com.aurafit.entity.User;
import com.aurafit.repository.UserRepository;

import com.aurafit.security.CustomUserDetailsService;
import com.aurafit.service.UserService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng rồi ông ơi!");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
        return "Đăng ký tài khoản thành công!";
    }

    @Override
    public AuthResponse login(AuthRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Sai tài khoản hoặc mật khẩu rồi ông giáo!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Sai tài khoản hoặc mật khẩu rồi ông giáo!");
        }

        // 1. Sinh Access Token (Lưu trữ tại Memory của Frontend)
        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        // 2. Sinh Refresh Token dài hạn (Sử dụng hàm generateRefreshToken vừa đồng bộ)
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail(), user.getId(),
                user.getRole().name());

        // 3. Đóng gói Refresh Token vào HttpOnly Cookie gửi về trình duyệt
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true); // Khóa cứng, chặn XSS tấn công bằng mã độc Javascript
        refreshTokenCookie.setSecure(false); // Để false chạy thử nghiệm ở localhost
        refreshTokenCookie.setPath("/"); // Cấu hình cookie áp dụng cho tất cả endpoint hệ thống
        refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // Thời gian sống: 7 ngày

        response.addCookie(refreshTokenCookie);

        // 4. Chỉ trả Access Token về Body JSON để Frontend hứng lưu vào RAM (Memory)
        return new AuthResponse(accessToken, user.getEmail(), user.getRole().name());
    }

    @Override
    public AuthResponse refresh(HttpServletRequest request) {
        String refreshToken = null;
        Cookie[] cookies = request.getCookies();

        // 1. Trích xuất mâm cỗ Cookies tìm bửu bối mang tên "refreshToken"
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        // 2. Kiểm tra tính toàn vẹn của Refresh Token trích xuất từ Cookie
        if (refreshToken == null) {
            throw new RuntimeException("Phiên làm việc đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại!");
        }

        // Khớp 100% với hàm trích xuất của Provider
        String email = jwtTokenProvider.extractUsername(refreshToken);

        // Gọi CustomUserDetailsService bốc đối tượng UserDetails lên
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

        // Ném đầy đủ cả 2 tham số (token, userDetails) vào kiểm tra
        if (!jwtTokenProvider.validateToken(refreshToken, userDetails)) {
            throw new RuntimeException("Mã xác thực không hợp lệ, vui lòng đăng nhập lại!");
        }

        // 3. Nếu mọi thứ hợp lệ, sinh Access Token mới tinh
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hợp lệ!"));

        // Gia hạn Access Token mới trả về cho bộ nhớ Memory của Frontend
        String newAccessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        return new AuthResponse(newAccessToken, user.getEmail(), user.getRole().name());
    }
}