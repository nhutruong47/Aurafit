package com.aurafit.service;

import com.aurafit.dto.LoginUserRequest;
import com.aurafit.dto.RegisterUserRequest;
import com.aurafit.dto.UserResponse;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse register(RegisterUserRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            throw new IllegalArgumentException("Email already exists.");
        });

        User user = User.builder()
                .email(request.email())
                .password(request.password())
                .fullName(request.fullName())
                .phone(request.phone())
                .role("CUSTOMER")
                .build();

        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse login(LoginUserRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.email()));

        if (!user.getPassword().equals(request.password())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        return UserResponse.from(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public User addRole(User user, String role) {
        String currentRole = user.getRole() == null || user.getRole().isBlank() ? "CUSTOMER" : user.getRole();
        boolean exists = Arrays.stream(currentRole.split(","))
                .map(String::trim)
                .anyMatch(value -> value.equalsIgnoreCase(role));

        if (!exists) {
            user.setRole(currentRole + "," + role.toUpperCase(Locale.ROOT));
            return userRepository.save(user);
        }

        return user;
    }
}
