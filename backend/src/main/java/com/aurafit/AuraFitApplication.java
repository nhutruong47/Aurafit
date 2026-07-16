package com.aurafit;

import com.aurafit.entity.User;
import com.aurafit.enums.Role;
import com.aurafit.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.crypto.password.PasswordEncoder;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
@EnableScheduling
public class AuraFitApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuraFitApplication.class, args);
    }

    @PostConstruct
    public void init() {
        // Đặt múi giờ mặc định cho toàn bộ ứng dụng để đồng bộ thời gian với VNPay/SePay
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    }

    @Bean
    public CommandLineRunner initAdminAccount(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "admin@aurafit.com";
            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setPasswordHash(passwordEncoder.encode("12345678"));
                admin.setRole(Role.ADMIN);
                admin.setFullName("System Admin");
                admin.setEmailVerified(true);
                userRepository.save(admin);
                System.out.println("Default admin account created: " + adminEmail);
            }
        };
    }
}
