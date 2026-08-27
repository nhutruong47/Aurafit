package com.aurafit.config;

import com.aurafit.business.advertisement.entity.AdPosition;
import com.aurafit.business.advertisement.entity.Advertisement;
import com.aurafit.business.advertisement.repository.AdvertisementRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Profile("dev")
public class AdvertisementSeeder implements CommandLineRunner {

    private final AdvertisementRepository repository;

    public AdvertisementSeeder(AdvertisementRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Người dùng muốn tự setup trong Admin, nên không tạo dữ liệu mẫu nữa.
        // Xóa hết dữ liệu cũ để trả lại trạng thái trống.
        repository.deleteAll();
        System.out.println("✅ Cleared advertisement data. Ready for manual setup in Admin.");
    }
}
