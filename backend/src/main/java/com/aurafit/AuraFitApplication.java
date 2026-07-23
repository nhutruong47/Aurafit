package com.aurafit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
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

}
