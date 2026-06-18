package com.aurafit.service;

import com.aurafit.dto.request.AuthRequest;
import com.aurafit.dto.request.RegisterRequest;
import com.aurafit.dto.response.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface UserService {
    void register(RegisterRequest request);

    AuthResponse login(AuthRequest request, HttpServletResponse response);

    AuthResponse refresh(HttpServletRequest request);
}
