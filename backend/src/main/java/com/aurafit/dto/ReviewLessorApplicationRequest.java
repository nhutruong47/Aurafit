package com.aurafit.dto;

public record ReviewLessorApplicationRequest(
        Long adminUserId,
        String rejectReason
) {
}
