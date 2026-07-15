package com.aurafit.service;

import com.aurafit.dto.request.PaymentCreateRequest;
import com.aurafit.dto.request.SePayWebhookRequest;
import com.aurafit.dto.response.PaymentInitResponse;
import com.aurafit.dto.response.PaymentStatusResponse;

public interface PaymentService {

    PaymentInitResponse initializePayment(PaymentCreateRequest request, String currentUserEmail);

    void processSePayWebhook(SePayWebhookRequest webhookBody, String authToken);

    void processTestWebhook(SePayWebhookRequest webhookBody);

    PaymentStatusResponse getPaymentStatus(Long orderId, String currentUserEmail);
}
