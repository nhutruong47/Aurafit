package com.aurafit.business.order.dto.response;

import com.aurafit.business.order.entity.HandoverRecord;
import com.aurafit.business.order.enums.HandoverType;
import com.aurafit.business.order.enums.ReturnStatus;

import java.time.LocalDateTime;

public record HandoverRecordDTO(
        Long id,
        Long rentalOrderDetailId,
        Long staffUserId,
        String staffUserName,
        HandoverType handoverType,
        ReturnStatus returnStatus,
        String imageUrl,
        String note,
        LocalDateTime createdAt
) {
    public static HandoverRecordDTO fromEntity(HandoverRecord record) {
        return new HandoverRecordDTO(
                record.getId(),
                record.getRentalOrderDetail().getId(),
                record.getStaffUser().getId(),
                record.getStaffUser().getFullName(),
                record.getHandoverType(),
                record.getReturnStatus(),
                record.getImageUrl(),
                record.getNote(),
                record.getCreatedAt()
        );
    }
}
