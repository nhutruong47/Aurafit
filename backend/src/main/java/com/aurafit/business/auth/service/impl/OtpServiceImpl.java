package com.aurafit.business.auth.service.impl;

import com.aurafit.business.auth.entity.OtpVerification;
import com.aurafit.business.auth.service.OtpService;
import com.aurafit.common.exception.BadRequestException;
import com.aurafit.business.auth.repository.OtpVerificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpServiceImpl implements OtpService {

    private static final int OTP_TTL_MINUTES = 5;
    private static final int OTP_LENGTH = 6;

    private final OtpVerificationRepository repository;
    private final Random random = new Random();

    public OtpServiceImpl(OtpVerificationRepository repository) {
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
                .orElseThrow(() -> new BadRequestException("Bạn chưa yêu cầu mã xác thực OTP. Vui lòng yêu cầu lại."));
        if (entry.isExpired()) {
            repository.deleteByEmail(email);
            throw new BadRequestException("Mã xác thực OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.");
        }
        return entry;
    }

    /**
     * Verifies that the supplied code matches the stored entry.
     */
    public void verify(String email, String inputCode) {
        OtpVerification entry = getValidEntry(email);
        if (!entry.getOtpCode().equals(inputCode)) {
            throw new BadRequestException("Mã xác thực OTP không chính xác. Vui lòng thử lại.");
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
