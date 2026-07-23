package com.aurafit.analytics.service.impl;

import com.aurafit.ai.analytics.dto.response.DashboardMetricsDTO;
import com.aurafit.ai.analytics.service.impl.AnalyticsServiceImpl;
import com.aurafit.common.dto.response.PaginatedResponse;
import com.aurafit.ai.analytics.dto.response.RevenueTransactionDTO;
import com.aurafit.business.payment.entity.Payment;
import com.aurafit.business.order.entity.RentalOrder;
import com.aurafit.business.user.entity.User;
import com.aurafit.business.order.enums.OrderStatus;
import com.aurafit.business.payment.enums.PaymentMethod;
import com.aurafit.business.payment.enums.PaymentStatus;
import com.aurafit.business.payment.enums.PaymentType;
import com.aurafit.common.exception.BadRequestException;
import com.aurafit.business.catalog.repository.CategoryRepository;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.business.payment.repository.PaymentRepository;
import com.aurafit.business.order.repository.RentalOrderDetailRepository;
import com.aurafit.business.order.repository.RentalOrderRepository;
import com.aurafit.business.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock
    private RentalOrderRepository rentalOrderRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RentalOrderDetailRepository rentalOrderDetailRepository;
    @Mock
    private CostumeRepository costumeRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    @Test
    void getDashboardMetrics_usesPaidPaymentsAndCountsAllUsers() {
        when(paymentRepository.calculateTotalAmountByTypeAndStatus(PaymentType.PAYMENT, PaymentStatus.PAID))
                .thenReturn(new BigDecimal("1250000"));
        when(rentalOrderRepository.count()).thenReturn(18L);
        when(userRepository.count()).thenReturn(9L);
        when(rentalOrderRepository.countByStatus(OrderStatus.PENDING)).thenReturn(3L);
        when(costumeRepository.count()).thenReturn(24L);
        when(categoryRepository.count()).thenReturn(6L);

        DashboardMetricsDTO metrics = analyticsService.getDashboardMetrics();

        assertEquals(new BigDecimal("1250000"), metrics.totalRevenue());
        assertEquals(18L, metrics.totalOrders());
        assertEquals(9L, metrics.totalUsers());
        assertEquals(3L, metrics.pendingOrdersCount());
        assertEquals(24L, metrics.totalCostumes());
        assertEquals(6L, metrics.totalCategories());
        verify(userRepository).count();
    }

    @Test
    void getRevenueTransactions_returnsMappedPaidPayments() {
        LocalDateTime paidAt = LocalDateTime.of(2026, 7, 18, 14, 30);
        User customer = new User();
        customer.setFullName("Nguyễn An");
        customer.setEmail("an@example.com");
        customer.setPhone("0900000000");

        RentalOrder order = new RentalOrder();
        order.setId(42L);
        order.setUser(customer);
        order.setStatus(OrderStatus.RENTED);

        Payment payment = new Payment();
        payment.setId(7L);
        payment.setRentalOrder(order);
        payment.setAmount(new BigDecimal("750000"));
        payment.setMethod(PaymentMethod.BANKING);
        payment.setStatus(PaymentStatus.PAID);
        payment.setType(PaymentType.PAYMENT);
        payment.setTransactionId("FT-42");
        payment.setUpdatedAt(paidAt);

        when(paymentRepository.findRevenueTransactions(
                eq(PaymentType.PAYMENT),
                eq(PaymentStatus.PAID),
                any(),
                any(),
                eq("FT-42"),
                any()
        )).thenReturn(new PageImpl<>(List.of(payment)));

        PaginatedResponse<RevenueTransactionDTO> result = analyticsService.getRevenueTransactions(
                0,
                10,
                "  FT-42  ",
                paidAt.minusDays(1),
                paidAt.plusDays(1)
        );

        assertEquals(1, result.content().size());
        RevenueTransactionDTO transaction = result.content().getFirst();
        assertEquals(7L, transaction.paymentId());
        assertEquals(42L, transaction.orderId());
        assertEquals("Nguyễn An", transaction.customerName());
        assertEquals(new BigDecimal("750000"), transaction.amount());
        assertEquals(paidAt, transaction.paidAt());
    }

    @Test
    void getRevenueTransactions_rejectsInvalidDateRange() {
        LocalDateTime startDate = LocalDateTime.of(2026, 7, 19, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2026, 7, 18, 23, 59);

        assertThrows(
                BadRequestException.class,
                () -> analyticsService.getRevenueTransactions(0, 10, null, startDate, endDate)
        );
        verifyNoInteractions(paymentRepository);
    }

    @Test
    void getRevenueTransactions_replacesMissingFiltersWithTypedValues() {
        when(paymentRepository.findRevenueTransactions(
                eq(PaymentType.PAYMENT),
                eq(PaymentStatus.PAID),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                eq(""),
                any()
        )).thenReturn(new PageImpl<>(List.of()));

        analyticsService.getRevenueTransactions(0, 10, null, null, null);

        ArgumentCaptor<LocalDateTime> startCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(paymentRepository).findRevenueTransactions(
                eq(PaymentType.PAYMENT),
                eq(PaymentStatus.PAID),
                startCaptor.capture(),
                endCaptor.capture(),
                eq(""),
                any()
        );
        assertEquals(LocalDateTime.of(1970, 1, 1, 0, 0), startCaptor.getValue());
        assertFalse(endCaptor.getValue().isBefore(startCaptor.getValue()));
    }
}
