package com.aurafit.service.impl;

import com.aurafit.dto.request.SePayWebhookRequest;
import com.aurafit.entity.Payment;
import com.aurafit.entity.RentalOrder;
import com.aurafit.enums.OrderStatus;
import com.aurafit.enums.PaymentStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.PaymentRepository;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RentalOrderRepository rentalOrderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CostumeItemRepository costumeItemRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private final String VALID_TOKEN = "secret-token";
    private final String VA_ACCOUNT = "BIDV123456";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "sepayWebhookSecret", VALID_TOKEN);
        ReflectionTestUtils.setField(paymentService, "sepayVaAccount", VA_ACCOUNT);
    }

    @Test
    void processSePayWebhook_Success() {
        // Arrange
        SePayWebhookRequest request = new SePayWebhookRequest(
                "Sepay",
                new BigDecimal("650000"), // transferAmount
                null, // amount
                "ARF123", // content
                "FT123456", // code
                VA_ACCOUNT, // accountNumber
                1L, // sePayId
                null, // fromAccount
                null, // fromBank
                null, // toAccount
                null, // transactionDate
                null  // status
        );

        RentalOrder order = new RentalOrder();
        order.setId(123L);
        order.setStatus(OrderStatus.PENDING);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setAmount(new BigDecimal("650000")); // Expected amount includes shipping fee
        payment.setStatus(PaymentStatus.PENDING);
        payment.setRentalOrder(order);

        when(paymentRepository.findFirstByTransactionId(request.code())).thenReturn(Optional.empty());
        when(paymentRepository.findByRentalOrderIdAndType(123L, com.aurafit.enums.PaymentType.PAYMENT))
                .thenReturn(Optional.of(payment));

        // Act
        paymentService.processSePayWebhook(request, VALID_TOKEN);

        // Assert
        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertEquals("FT123456", payment.getTransactionId());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());

        verify(paymentRepository).save(payment);
        verify(rentalOrderRepository).save(order);
    }

    @Test
    void processSePayWebhook_Failure_InsufficientAmount() {
        // Arrange
        SePayWebhookRequest request = new SePayWebhookRequest(
                "Sepay",
                new BigDecimal("600000"), // transferAmount - User forgot shipping fee
                null, // amount
                "ARF123", // content
                "FT123456", // code
                VA_ACCOUNT, // accountNumber
                1L, // sePayId
                null, // fromAccount
                null, // fromBank
                null, // toAccount
                null, // transactionDate
                null  // status
        );

        RentalOrder order = new RentalOrder();
        order.setId(123L);
        order.setStatus(OrderStatus.PENDING);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setAmount(new BigDecimal("650000")); // Expected amount includes shipping fee
        payment.setStatus(PaymentStatus.PENDING);
        payment.setRentalOrder(order);

        when(paymentRepository.findFirstByTransactionId(request.code())).thenReturn(Optional.empty());
        when(paymentRepository.findByRentalOrderIdAndType(123L, com.aurafit.enums.PaymentType.PAYMENT))
                .thenReturn(Optional.of(payment));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            paymentService.processSePayWebhook(request, VALID_TOKEN);
        });

        assertTrue(exception.getMessage().contains("Transfer amount mismatch"));

        // Ensure no status updates were made
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        assertEquals(OrderStatus.PENDING, order.getStatus());

        verify(paymentRepository, never()).save(any(Payment.class));
        verify(rentalOrderRepository, never()).save(any(RentalOrder.class));
    }

    @Test
    void processSePayWebhook_shouldAcceptAmountFallback() {
        SePayWebhookRequest request = new SePayWebhookRequest(
                "Sepay",
                null,
                new BigDecimal("650000"),
                "ARF123",
                "FT-AMOUNT-FALLBACK",
                null,
                2L,
                null,
                null,
                VA_ACCOUNT,
                null,
                null
        );

        RentalOrder order = new RentalOrder();
        order.setId(123L);
        order.setStatus(OrderStatus.PENDING);

        Payment payment = new Payment();
        payment.setId(2L);
        payment.setAmount(new BigDecimal("650000"));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setRentalOrder(order);

        when(paymentRepository.findFirstByTransactionId(request.code())).thenReturn(Optional.empty());
        when(paymentRepository.findByRentalOrderIdAndType(123L, com.aurafit.enums.PaymentType.PAYMENT))
                .thenReturn(Optional.of(payment));

        paymentService.processSePayWebhook(request, VALID_TOKEN);

        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
    }

    @Test
    void processSePayWebhook_shouldRejectMissingAmount() {
        SePayWebhookRequest request = new SePayWebhookRequest(
                "Sepay",
                null,
                null,
                "ARF123",
                "FT-MISSING-AMOUNT",
                VA_ACCOUNT,
                3L,
                null,
                null,
                null,
                null,
                null
        );

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> paymentService.processSePayWebhook(request, VALID_TOKEN)
        );

        assertEquals("Transfer amount is required", exception.getMessage());
        verifyNoInteractions(paymentRepository, rentalOrderRepository);
    }

    @Test
    void processSePayWebhook_shouldRejectInvalidToken() {
        SePayWebhookRequest request = new SePayWebhookRequest(
                "Sepay",
                new BigDecimal("650000"),
                null,
                "ARF123",
                "FT-INVALID-TOKEN",
                VA_ACCOUNT,
                4L,
                null,
                null,
                null,
                null,
                null
        );

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> paymentService.processSePayWebhook(request, "wrong-token")
        );

        assertEquals("Invalid Webhook Token", exception.getMessage());
        verifyNoInteractions(paymentRepository, rentalOrderRepository);
    }
}
