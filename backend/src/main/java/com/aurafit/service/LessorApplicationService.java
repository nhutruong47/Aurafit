package com.aurafit.service;

import com.aurafit.dto.CreateLessorApplicationRequest;
import com.aurafit.dto.LessorApplicationResponse;
import com.aurafit.dto.ReviewLessorApplicationRequest;
import com.aurafit.entity.LessorApplication;
import com.aurafit.entity.Shop;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.LessorApplicationRepository;
import com.aurafit.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LessorApplicationService {

    private final LessorApplicationRepository lessorApplicationRepository;
    private final ShopRepository shopRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<LessorApplicationResponse> getApplications(String status) {
        List<LessorApplication> applications = status == null || status.isBlank()
                ? lessorApplicationRepository.findAllByOrderByCreatedAtDesc()
                : lessorApplicationRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());

        return applications.stream()
                .map(LessorApplicationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LessorApplicationResponse> getApplicationsByUser(Long userId) {
        return lessorApplicationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(LessorApplicationResponse::from)
                .toList();
    }

    @Transactional
    public LessorApplicationResponse createApplication(CreateLessorApplicationRequest request) {
        User user = userService.getUserById(request.userId());
        List<LessorApplication> existingApplications = lessorApplicationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        boolean hasOpenApplication = existingApplications.stream()
                .anyMatch(application -> "PENDING".equalsIgnoreCase(application.getStatus()));
        if (hasOpenApplication) {
            throw new IllegalArgumentException("User already has a pending lessor application.");
        }

        boolean isApproved = existingApplications.stream()
                .anyMatch(application -> "APPROVED".equalsIgnoreCase(application.getStatus()));
        if (isApproved) {
            throw new IllegalArgumentException("User is already approved as a lessor.");
        }

        LessorApplication application = LessorApplication.builder()
                .user(user)
                .shopName(request.shopName())
                .shopAddress(request.shopAddress())
                .citizenIdImageUrl(request.citizenIdImageUrl())
                .bankAccountNumber(request.bankAccountNumber())
                .status("PENDING")
                .build();

        return LessorApplicationResponse.from(lessorApplicationRepository.save(application));
    }

    @Transactional
    public LessorApplicationResponse approveApplication(Long id, ReviewLessorApplicationRequest request) {
        LessorApplication application = getApplication(id);
        User reviewer = request.adminUserId() == null ? null : userService.getUserById(request.adminUserId());

        application.setStatus("APPROVED");
        application.setRejectReason(null);
        application.setReviewedBy(reviewer);
        application.setReviewedAt(LocalDateTime.now());

        User lessor = userService.addRole(application.getUser(), "LESSOR");
        shopRepository.findByOwnerId(lessor.getId())
                .map(shop -> {
                    shop.setName(application.getShopName());
                    shop.setAddress(application.getShopAddress());
                    shop.setStatus("ACTIVE");
                    return shopRepository.save(shop);
                })
                .orElseGet(() -> shopRepository.save(Shop.builder()
                        .owner(lessor)
                        .name(application.getShopName())
                        .address(application.getShopAddress())
                        .status("ACTIVE")
                        .build()));

        return LessorApplicationResponse.from(lessorApplicationRepository.save(application));
    }

    @Transactional
    public LessorApplicationResponse rejectApplication(Long id, ReviewLessorApplicationRequest request) {
        LessorApplication application = getApplication(id);
        User reviewer = request.adminUserId() == null ? null : userService.getUserById(request.adminUserId());

        application.setStatus("REJECTED");
        application.setRejectReason(request.rejectReason());
        application.setReviewedBy(reviewer);
        application.setReviewedAt(LocalDateTime.now());

        return LessorApplicationResponse.from(lessorApplicationRepository.save(application));
    }

    private LessorApplication getApplication(Long id) {
        return lessorApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LessorApplication", "id", id));
    }
}
