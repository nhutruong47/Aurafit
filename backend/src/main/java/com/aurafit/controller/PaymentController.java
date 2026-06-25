package com.aurafit.controller;

import com.aurafit.dto.request.PaymentCreateRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.PaymentInitResponse;
import com.aurafit.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment", description = "Payment initiation via VietQR")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @Operation(
            summary = "Initialize a VietQR payment",
            description = "Creates or reuses a PENDING Payment record for the authenticated user's order "
                    + "and returns a VietQR image URL for the customer to scan."
    )
    public ResponseEntity<ApiResponse<PaymentInitResponse>> createPayment(
            Authentication authentication,
            @Valid @RequestBody PaymentCreateRequest request
    ) {
        String email = authentication.getName();
        PaymentInitResponse response = paymentService.initializePayment(request, email);
        return ResponseEntity.ok(ApiResponse.success("Payment initialized successfully.", response));
    }
}
