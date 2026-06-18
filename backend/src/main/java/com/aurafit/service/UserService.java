package com.aurafit.service;

import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.response.AuthResponseDTO;

public interface UserService {

    void register(RegisterRequest request);

    AuthResponseDTO login(AuthRequest request);

    AuthResponseDTO refresh(String refreshToken);
}
