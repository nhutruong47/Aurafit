package com.aurafit.controller;

import com.aurafit.dto.request.SePayWebhookRequest;
import com.aurafit.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/payment")
public class SePayWebhookController {

    private final PaymentService paymentService;

    public SePayWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/sepay-webhooks")
    @Operation(summary = "Receive SePay Webhook")
    public ResponseEntity<WebhookResponse> handleSePayWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SePayWebhookRequest body
    ) {
        // SePay sends "Apikey <token>", extract token from header
        String token = (authHeader != null && authHeader.startsWith("Apikey "))
                ? authHeader.substring(7)
                : authHeader;
        paymentService.processSePayWebhook(body, token);
        return ResponseEntity.ok(new WebhookResponse(200, "Success"));
    }

    @PostMapping("/test-webhook")
    @Profile("dev")
    @Operation(summary = "[DEV ONLY] Simulate SePay webhook to test payment flow")
    public ResponseEntity<WebhookResponse> simulateWebhook(
            @Valid @RequestBody SePayWebhookRequest body
    ) {
        paymentService.processTestWebhook(body);
        return ResponseEntity.ok(new WebhookResponse(200, "Test webhook processed"));
    }

    private record WebhookResponse(int status, String message) {}
}
