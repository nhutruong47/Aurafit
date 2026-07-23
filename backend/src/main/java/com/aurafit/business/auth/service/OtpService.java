package com.aurafit.business.auth.service;

import com.aurafit.business.auth.entity.OtpVerification;

public interface OtpService {

    /**
     * Generates a new OTP and (over)writes the verification record for the
     * given email. Registration data is persisted alongside the OTP so Step 2
     * only needs to verify the code.
     */
    void store(String email, String fullName, String phone, String passwordHash);

    /**
     * Retrieves the stored OTP record for the given email.
     */
    OtpVerification getValidEntry(String email);

    /**
     * Verifies that the supplied code matches the stored entry.
     */
    void verify(String email, String inputCode);

    /**
     * Removes the OTP record after successful verification.
     */
    void remove(String email);
}
