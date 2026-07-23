package com.aurafit.business.user.service;

import com.aurafit.business.auth.dto.request.AuthRequest;
import com.aurafit.business.auth.dto.request.RegisterRequest;
import com.aurafit.business.user.dto.request.ChangePasswordRequestDTO;
import com.aurafit.business.user.dto.request.StaffCreateRequest;
import com.aurafit.business.auth.dto.response.AuthResponseDTO;
import com.aurafit.business.user.dto.request.UpdateProfileRequestDTO;
import com.aurafit.business.user.dto.response.StaffAccountResponseDTO;
import com.aurafit.business.user.dto.response.UserResponseDTO;
import com.aurafit.business.user.enums.Role;
import com.aurafit.business.user.enums.UserStatus;

public interface UserService {

    void register(RegisterRequest request);

    AuthResponseDTO login(AuthRequest request);

    AuthResponseDTO refresh(String refreshToken);

    Long getUserIdByEmail(String email);

    com.aurafit.common.dto.response.PaginatedResponse<UserResponseDTO> getAllUsers(
            int pageNo,
            int pageSize,
            String sortBy,
            String sortDir,
            String keyword,
            Role role
    );


    StaffAccountResponseDTO createStaffAccount(StaffCreateRequest request);

    UserResponseDTO updateUserStatus(Long userId, UserStatus status);

    UserResponseDTO updateProfile(Long userId, UpdateProfileRequestDTO request);

    void changePassword(Long userId, ChangePasswordRequestDTO request);

}
