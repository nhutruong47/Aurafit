package com.aurafit.service;

import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.request.StaffCreateRequest;
import com.aurafit.dto.response.AuthResponseDTO;
import com.aurafit.dto.response.StaffAccountResponseDTO;
import com.aurafit.dto.response.UserResponseDTO;
import com.aurafit.enums.Role;
import com.aurafit.enums.UserStatus;

import java.util.List;

public interface UserService {

    void register(RegisterRequest request);

    AuthResponseDTO login(AuthRequest request);

    AuthResponseDTO refresh(String refreshToken);

    Long getUserIdByEmail(String email);

    com.aurafit.dto.response.PaginatedResponse<UserResponseDTO> getAllUsers(
            int pageNo,
            int pageSize,
            String sortBy,
            String sortDir,
            String keyword,
            Role role
    );


    StaffAccountResponseDTO createStaffAccount(StaffCreateRequest request);

    UserResponseDTO updateUserStatus(Long userId, UserStatus status);

    UserResponseDTO updateProfile(Long userId, com.aurafit.dto.request.UpdateProfileRequestDTO request);

    void changePassword(Long userId, com.aurafit.dto.request.ChangePasswordRequestDTO request);

}
