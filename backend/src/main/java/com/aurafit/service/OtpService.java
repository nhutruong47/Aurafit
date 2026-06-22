package com.aurafit.service;

import com.aurafit.entity.OtpVerification;
import com.aurafit.exception.BadRequestException;
import com.aurafit.repository.OtpVerificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {

    private static final int OTP_TTL_MINUTES = 5;
    private static final int OTP_LENGTH = 6;

    private final OtpVerificationRepository repository;
    private final Random random = new Random();

    public OtpService(OtpVerificationRepository repository) {
        this.repository = repository;
    }

    /**
     * Generates a new OTP and (over)writes the verification record for the
     * given email. Registration data is persisted alongside the OTP so Step 2
     * only needs to verify the code.
     */
    @Transactional
    public void store(String email, String fullName, String phone, String passwordHash) {
        String code = generateOtp();
        LocalDateTime now = LocalDateTime.now();

        OtpVerification entry = repository.findByEmail(email).orElseGet(OtpVerification::new);
        entry.setEmail(email);
        entry.setOtpCode(code);
        entry.setExpiresAt(now.plusMinutes(OTP_TTL_MINUTES));
        entry.setFullName(fullName);
        entry.setPhone(phone);
        entry.setPasswordHash(passwordHash);
        repository.save(entry);
    }

    /**
     * Retrieves the stored OTP record for the given email.
     */
    public OtpVerification getValidEntry(String email) {
        OtpVerification entry = repository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Ban chua yeu cau ma OTP. Vui long gui lai."));
        if (entry.isExpired()) {
            repository.deleteByEmail(email);
            throw new BadRequestException("Ma OTP da het han (qua 5 phut). Vui long gui lai.");
        }
        return entry;
    }

    /**
     * Verifies that the supplied code matches the stored entry.
     */
    public void verify(String email, String inputCode) {
        OtpVerification entry = getValidEntry(email);
        if (!entry.getOtpCode().equals(inputCode)) {
            throw new BadRequestException("Ma OTP khong dung. Vui long thu lai.");
        }
    }

    /**
     * Removes the OTP record after successful verification.
     */
    @Transactional
    public void remove(String email) {
        repository.deleteByEmail(email);
    }

    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH - 1);  // 100_000
        return String.valueOf(bound + random.nextInt(bound * 9)); // 100000 – 999999
    }
}
