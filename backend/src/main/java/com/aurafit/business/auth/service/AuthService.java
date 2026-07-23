package com.aurafit.business.auth.service;

import com.aurafit.business.auth.dto.request.OtpRequestDTO;
import com.aurafit.business.auth.dto.request.VerifyOtpRequestDTO;
import com.aurafit.business.auth.dto.response.AuthResponseDTO;
import com.aurafit.business.auth.dto.response.OtpSentResponse;

public interface AuthService {

    /**
     * Persists the full registration payload into the OTP cache, generates an
     * OTP, and dispatches it via Gmail SMTP. The user is not yet committed to
     * the database — that happens in Step 2 after the OTP is verified.
     *
     * @param request contains email, fullName, phone, password
     * @return a lightweight response confirming dispatch
     */
    OtpSentResponse requestOtp(OtpRequestDTO request);

    /**
     * Verifies the OTP from the cache. The registration payload (full name,
     * phone, hashed password) is also read from the same cache entry so the
     * user is finally persisted with emailVerified = true.
     *
     * @param request contains email and otpCode
     * @return AuthResponseDTO with accessToken, refreshToken, and user data
     */
    AuthResponseDTO verifyOtpAndRegister(VerifyOtpRequestDTO request);
}
