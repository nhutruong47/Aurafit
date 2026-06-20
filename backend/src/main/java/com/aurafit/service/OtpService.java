package com.aurafit.service;

import com.aurafit.exception.BadRequestException;
import com.aurafit.entity.OtpEntry;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final int OTP_TTL_MINUTES = 5;
    private static final int OTP_LENGTH = 6;

    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * Stores a newly generated OTP for the given email, overwriting any existing
     * entry (resend scenario).
     */
    public void store(String email) {
        String code = generateOtp();
        LocalDateTime now = LocalDateTime.now();
        otpCache.put(email, new OtpEntry(code, now, now.plusMinutes(OTP_TTL_MINUTES)));
    }

    /**
     * Retrieves the stored OTP entry for the given email.
     *
     * @throws BadRequestException if no OTP was requested for this email,
     *                             or if the OTP has expired.
     */
    public OtpEntry getValidEntry(String email) {
        OtpEntry entry = otpCache.get(email);
        if (entry == null) {
            throw new BadRequestException("Ban chua yeu cau ma OTP. Vui long gui lai.");
        }
        if (entry.isExpired()) {
            otpCache.remove(email);
            throw new BadRequestException("Ma OTP da het han (qua 5 phut). Vui long gui lai.");
        }
        return entry;
    }

    /**
     * Verifies that the supplied code matches the stored entry.
     *
     * @throws BadRequestException if the code does not match.
     */
    public void verify(String email, String inputCode) {
        OtpEntry entry = getValidEntry(email);
        if (!entry.getOtpCode().equals(inputCode)) {
            throw new BadRequestException("Ma OTP khong dung. Vui long thu lai.");
        }
    }

    /**
     * Removes the OTP entry after successful verification.
     */
    public void remove(String email) {
        otpCache.remove(email);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH - 1);  // 100_000
        return String.valueOf(bound + random.nextInt(bound * 9)); // 100000 – 999999
    }
}
