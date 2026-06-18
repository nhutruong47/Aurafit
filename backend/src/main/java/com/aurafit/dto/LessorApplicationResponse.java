package com.aurafit.dto;

import com.aurafit.entity.LessorApplication;

import java.time.LocalDateTime;

public record LessorApplicationResponse(
        Long id,
        Long userId,
        String userEmail,
        String userFullName,
        String shopName,
        String shopAddress,
        String citizenIdImageUrl,
        String bankAccountNumber,
        String status,
        String rejectReason,
        Long reviewedById,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt
) {
    public static LessorApplicationResponse from(LessorApplication application) {
        return new LessorApplicationResponse(
                application.getId(),
                application.getUser().getId(),
                application.getUser().getEmail(),
                application.getUser().getFullName(),
                application.getShopName(),
                application.getShopAddress(),
                application.getCitizenIdImageUrl(),
                application.getBankAccountNumber(),
                application.getStatus(),
                application.getRejectReason(),
                application.getReviewedBy() == null ? null : application.getReviewedBy().getId(),
                application.getCreatedAt(),
                application.getReviewedAt()
        );
    }
}
