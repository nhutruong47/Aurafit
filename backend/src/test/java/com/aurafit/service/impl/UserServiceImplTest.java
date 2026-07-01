package com.aurafit.service.impl;

import com.aurafit.dto.request.StaffCreateRequest;
import com.aurafit.dto.response.StaffAccountResponseDTO;
import com.aurafit.entity.User;
import com.aurafit.enums.Role;
import com.aurafit.enums.UserStatus;
import com.aurafit.repository.UserRepository;
import com.aurafit.security.CustomUserDetailsService;
import com.aurafit.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void createStaffAccount_shouldPersistStaffWithTemporaryPassword() {
        when(userRepository.existsByEmail("staff@aurafit.com")).thenReturn(false);
        when(passwordEncoder.encode("Temp@12345")).thenReturn("encoded-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffCreateRequest request = new StaffCreateRequest(
                "Staff Test",
                "staff@aurafit.com",
                "0909000000",
                UserStatus.ACTIVE,
                "Temp@12345"
        );

        StaffAccountResponseDTO response = userService.createStaffAccount(request);

        assertEquals(Role.STAFF, response.role());
        assertEquals(UserStatus.ACTIVE, response.status());
        verify(userRepository).save(argThat(user ->
                user.getRole() == Role.STAFF &&
                user.getStatus() == UserStatus.ACTIVE &&
                "encoded-hash".equals(user.getPasswordHash())
        ));
    }
}
