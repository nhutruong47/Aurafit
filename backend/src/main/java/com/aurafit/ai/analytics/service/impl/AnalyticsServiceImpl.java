package com.aurafit.ai.analytics.service.impl;

import com.aurafit.ai.analytics.dto.response.DashboardMetricsDTO;
import com.aurafit.business.catalog.repository.CategoryRepository;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.common.dto.response.PaginatedResponse;
import com.aurafit.ai.analytics.dto.response.RevenueChartDTO;
import com.aurafit.ai.analytics.dto.response.RevenueTransactionDTO;
import com.aurafit.ai.analytics.dto.response.TopCostumeDTO;
import com.aurafit.business.order.enums.OrderStatus;
import com.aurafit.business.payment.enums.PaymentStatus;
import com.aurafit.business.payment.enums.PaymentType;
import com.aurafit.common.exception.BadRequestException;
import com.aurafit.business.payment.repository.PaymentRepository;
import com.aurafit.business.order.repository.RentalOrderDetailRepository;
import com.aurafit.business.order.repository.RentalOrderRepository;
import com.aurafit.business.user.repository.UserRepository;
import com.aurafit.ai.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final RentalOrderRepository rentalOrderRepository;
    private final UserRepository userRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final CostumeRepository costumeRepository;
    private final CategoryRepository categoryRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardMetricsDTO getDashboardMetrics() {
        BigDecimal totalRevenue = paymentRepository.calculateTotalAmountByTypeAndStatus(
                PaymentType.PAYMENT,
                PaymentStatus.PAID
        );
        long totalOrders = rentalOrderRepository.count();
        long totalUsers = userRepository.count();
        long pendingOrdersCount = rentalOrderRepository.countByStatus(OrderStatus.PENDING);
        long totalCostumes = costumeRepository.count();
        long totalCategories = categoryRepository.count();

        return new DashboardMetricsDTO(
                totalRevenue != null ? totalRevenue : BigDecimal.ZERO,
                totalOrders,
                totalUsers,
                pendingOrdersCount,
                totalCostumes,
                totalCategories
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<RevenueChartDTO> getRevenueChart(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }

        List<Object[]> results = paymentRepository.getDailyPaidRevenue(startDate, endDate);
        return results.stream()
                .map(row -> new RevenueChartDTO((String) row[0], (BigDecimal) row[1]))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<RevenueTransactionDTO> getRevenueTransactions(
            int page,
            int size,
            String keyword,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Start date must not be after end date");
        }

        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        LocalDateTime effectiveStartDate = startDate != null
                ? startDate
                : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime effectiveEndDate = endDate != null ? endDate : LocalDateTime.now();
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        var payments = paymentRepository.findRevenueTransactions(
                PaymentType.PAYMENT,
                PaymentStatus.PAID,
                effectiveStartDate,
                effectiveEndDate,
                normalizedKeyword,
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "updatedAt"))
        );

        return PaginatedResponse.from(payments, RevenueTransactionDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopCostumeDTO> getTopCostumes(int limit) {
        return rentalOrderDetailRepository.findTopCostumes(PageRequest.of(0, limit));
    }
}
