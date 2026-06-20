package com.aurafit.dto.response;

import java.time.LocalDateTime;

/**
 * Lightweight response confirming the OTP has been dispatched.
 */
public record OtpSentResponse(
        LocalDateTime sentAt,
        String message
) {}
