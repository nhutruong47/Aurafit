package com.aurafit.business.auth.service.impl;

import com.aurafit.business.auth.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@aurafit.com}")
    private String fromEmail;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a HTML email containing the 6-digit OTP code.
     *
     * @param to      recipient email address
     * @param otpCode the 6-digit OTP
     */
    public void sendOtpEmail(String to, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Ma xac thuc AuraFit - Your AuraFit Verification Code");
            helper.setText(buildHtmlContent(otpCode), true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email xác thực. Vui lòng thử lại sau.", e);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String buildHtmlContent(String otpCode) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <style>
                    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 480px; margin: 40px auto; background: #ffffff;
                                  border-radius: 12px; overflow: hidden;
                                  box-shadow: 0 4px 20px rgba(0,0,0,0.10); }
                    .header { background: #6c63ff; padding: 32px 24px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
                    .body { padding: 32px 24px; text-align: center; }
                    .body p { color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
                    .otp-box { display: inline-block; background: #f0eeff;
                               border: 2px dashed #6c63ff; border-radius: 8px;
                               padding: 16px 32px; margin: 16px 0; }
                    .otp-code { font-size: 36px; font-weight: bold;
                                color: #6c63ff; letter-spacing: 8px; margin: 0; }
                    .warning { font-size: 12px; color: #999999; margin-top: 24px; }
                    .footer { background: #f9f9f9; padding: 16px 24px;
                              text-align: center; border-top: 1px solid #eeeeee; }
                    .footer p { font-size: 12px; color: #aaaaaa; margin: 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>AuraFit</h1>
                    </div>
                    <div class="body">
                      <p>Xin chao!</p>
                      <p>Ma xac thuc cua ban de hoan tat dang ky tai khoan AuraFit:</p>
                      <div class="otp-box">
                        <p class="otp-code">%s</p>
                      </div>
                      <p>Ma nay co hieu luc trong <strong>5 phut</strong>. Vui long khong chia se ma nay voi bat ky ai.</p>
                      <p class="warning">Neu ban khong yeu cau ma xac thuc, vui long bo qua email nay.</p>
                    </div>
                    <div class="footer">
                      <p>&copy; 2026 AuraFit. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(otpCode);
    }
}
