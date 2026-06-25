package com.aurafit.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * User profile management endpoints.
 * Authentication concerns (login, register, refresh, OTP) have been
 * consolidated into {@link AuthController} under /api/auth.
 *
 * Future endpoints:
 *  - GET  /api/users/me          → get authenticated user's profile
 *  - PUT  /api/users/me          → update profile
 *  - PUT  /api/users/me/password → change password
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "User profile management (future)")
public class UserController {

    // Reserved for profile management endpoints
}
