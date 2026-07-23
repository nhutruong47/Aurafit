package com.aurafit.business.order.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReturnRequestDTO(
        String imageUrl,
        String note,
        @NotEmpty(message = "assessments cannot be empty")
        @Valid
        List<ItemAssessmentDTO> assessments
) {}
