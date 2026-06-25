package com.aurafit.controller;

import com.aurafit.dto.request.SePayWebhookRequest;
import com.aurafit.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
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
            @RequestHeader("X-SePay-Auth-Token") String token,
            @Valid @RequestBody SePayWebhookRequest body
    ) {
        paymentService.processSePayWebhook(body, token);
        return ResponseEntity.ok(new WebhookResponse(200, "Success"));
    }

    private record WebhookResponse(int status, String message) {}
}
