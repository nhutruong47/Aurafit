package com.aurafit.controller;

import com.aurafit.dto.request.SePayWebhookRequest;
import com.aurafit.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/public/payment")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SePayWebhookController {

    private final PaymentService paymentService;

    public SePayWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/sepay-webhooks")
    @Operation(summary = "Receive SePay Webhook")
    public ResponseEntity<WebhookResponse> handleSePayWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-SePay-Auth-Token", required = false) String sepayToken,
            @Valid @RequestBody SePayWebhookRequest body
    ) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Apikey ")) {
            token = authHeader.substring(7);
        } else if (sepayToken != null) {
            token = sepayToken;
        } else if (authHeader != null) {
            token = authHeader;
        }
        paymentService.processSePayWebhook(body, token);
        return ResponseEntity.ok(WebhookResponse.ok());
    }

    @PostMapping("/test-webhook")
    @Profile("dev")
    @Operation(summary = "[DEV ONLY] Simulate SePay webhook to test payment flow")
    public ResponseEntity<WebhookResponse> simulateWebhook(
            @Valid @RequestBody SePayWebhookRequest body
    ) {
        paymentService.processTestWebhook(body);
        return ResponseEntity.ok(WebhookResponse.ok());
    }

    private record WebhookResponse(boolean success, String message) {
        public static WebhookResponse ok() {
            return new WebhookResponse(true, "Success");
        }
    }
}
