package com.aurafit.service;

import com.aurafit.dto.CreatePaymentRequest;
import com.aurafit.dto.PaymentResponse;
import com.aurafit.entity.Payment;
import com.aurafit.entity.RentalOrder;
import com.aurafit.repository.PaymentRepository;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RentalOrderRepository rentalOrderRepository;

    @Transactional
    public PaymentResponse createSuccessfulPayment(CreatePaymentRequest request) {
        String method = normalizePaymentMethod(request.paymentMethod());
        RentalOrder rentalOrder = rentalOrderRepository.findById(request.rentalOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id", request.rentalOrderId()));

        Payment payment = Payment.builder()
                .rentalOrder(rentalOrder)
                .amount(request.amount())
                .paymentType(request.paymentType())
                .paymentMethod(method)
                .transactionId(method + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT))
                .status("PAID")
                .paidAt(LocalDateTime.now())
                .build();

        rentalOrder.setStatus("PENDING_CONFIRMATION");
        rentalOrderRepository.save(rentalOrder);

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    private String normalizePaymentMethod(String paymentMethod) {
        String normalized = paymentMethod == null ? "" : paymentMethod.trim().toUpperCase(Locale.ROOT);
        if (!List.of("VNPAY", "BANKING").contains(normalized)) {
            throw new IllegalArgumentException("paymentMethod must be VNPAY or BANKING.");
        }
        return normalized;
    }
}
