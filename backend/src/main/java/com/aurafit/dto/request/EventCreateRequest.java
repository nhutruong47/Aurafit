package com.aurafit.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventCreateRequest(
        @NotBlank(message = "Tên sự kiện không được để trống")
        @Size(max = 200, message = "Tên sự kiện không được vượt quá 200 ký tự")
        String name,

        @Size(max = 220, message = "Slug sự kiện không được vượt quá 220 ký tự")
        String slug,

        String description,

        @Size(max = 500, message = "URL banner không được vượt quá 500 ký tự")
        String bannerImageUrl,

        @Size(max = 500, message = "URL banner dọc không được vượt quá 500 ký tự")
        String sideBannerImageUrl,

        @NotNull(message = "Phần trăm giảm giá là bắt buộc")
        @DecimalMin(value = "0", inclusive = false, message = "Phần trăm giảm giá phải lớn hơn 0")
        @DecimalMax(value = "100", message = "Phần trăm giảm giá không được vượt quá 100")
        @Digits(integer = 3, fraction = 2, message = "Phần trăm giảm giá chỉ được có tối đa 2 chữ số thập phân")
        BigDecimal discountPercent,

        @NotNull(message = "Thời gian bắt đầu là bắt buộc")
        LocalDateTime startDate,

        @NotNull(message = "Thời gian kết thúc là bắt buộc")
        LocalDateTime endDate,

        @Pattern(
                regexp = "(?i)DRAFT|ACTIVE|ENDED|CANCELLED",
                message = "Trạng thái sự kiện không hợp lệ"
        )
        String status
) {
}
