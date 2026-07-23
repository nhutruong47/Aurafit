package com.aurafit.business.payment.dto.response;

import java.math.BigDecimal;

public record PaymentInitResponse(
        String qrImageUrl,
        String paymentContent,
        BigDecimal amount,
        Integer orderId
) {}
