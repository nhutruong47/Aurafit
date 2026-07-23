package com.aurafit.business.auth.service;

public interface EmailService {

    /**
     * Sends a HTML email containing the 6-digit OTP code.
     *
     * @param to      recipient email address
     * @param otpCode the 6-digit OTP
     */
    void sendOtpEmail(String to, String otpCode);
}
