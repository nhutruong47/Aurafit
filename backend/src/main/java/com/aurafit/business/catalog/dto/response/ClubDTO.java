package com.aurafit.business.catalog.dto.response;

import com.aurafit.business.catalog.entity.Club;
import com.aurafit.business.catalog.enums.ClubStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ClubDTO(
        Long id,
        String name,
        String description,
        BigDecimal membershipFee,
        Double discountRate,
        ClubStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ClubDTO fromEntity(Club club) {
        return new ClubDTO(
                club.getId(),
                club.getName(),
                club.getDescription(),
                club.getMembershipFee(),
                club.getDiscountRate(),
                club.getStatus(),
                club.getCreatedAt(),
                club.getUpdatedAt()
        );
    }
}
