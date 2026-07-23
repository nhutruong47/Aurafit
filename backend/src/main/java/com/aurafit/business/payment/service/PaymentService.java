package com.aurafit.business.payment.service;

import com.aurafit.business.payment.dto.request.PaymentCreateRequest;
import com.aurafit.business.payment.dto.request.SePayWebhookRequest;
import com.aurafit.business.payment.dto.response.PaymentInitResponse;
import com.aurafit.business.payment.dto.response.PaymentStatusResponse;

public interface PaymentService {

    PaymentInitResponse initializePayment(PaymentCreateRequest request, String currentUserEmail);

    void processSePayWebhook(SePayWebhookRequest webhookBody, String authToken);

    void processTestWebhook(SePayWebhookRequest webhookBody);

    PaymentStatusResponse getPaymentStatus(Long orderId, String currentUserEmail);
}
