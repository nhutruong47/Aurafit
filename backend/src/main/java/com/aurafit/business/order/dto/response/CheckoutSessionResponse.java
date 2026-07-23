package com.aurafit.business.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutSessionResponse {
    private BigDecimal sessionTotalAmount;
    private List<OrderResponse> orders;
}
