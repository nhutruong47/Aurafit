package com.aurafit;

import com.aurafit.entity.User;
import com.aurafit.enums.Role;
import com.aurafit.enums.UserStatus;
import com.aurafit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
class InsertAdminIT {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void insertAdmin() {
        // Xóa admin cũ nếu đã tồn tại
        userRepository.findByEmail("admin@aurafit.com")
                .ifPresent(userRepository::delete);

        User admin = new User();
        admin.setEmail("admin@aurafit.com");
        admin.setFullName("AuraFit Admin");
        admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setEmailVerified(true);
        admin.setPhoneVerified(false);

        User saved = userRepository.save(admin);

        System.out.println("=========================================");
        System.out.println("✅ ADMIN ACCOUNT CREATED SUCCESSFULLY");
        System.out.println("=========================================");
        System.out.println("📧 Email   : admin@aurafit.com");
        System.out.println("🔑 Password: Admin@123");
        System.out.println("🆔 User ID : " + saved.getId());
        System.out.println("🛡️  Role    : " + saved.getRole());
        System.out.println("=========================================");
    }
}
