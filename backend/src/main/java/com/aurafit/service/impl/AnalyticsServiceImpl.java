package com.aurafit.service.impl;

import com.aurafit.dto.response.DashboardMetricsDTO;
import com.aurafit.dto.response.RevenueChartDTO;
import com.aurafit.dto.response.TopCostumeDTO;
import com.aurafit.enums.OrderStatus;
import com.aurafit.enums.Role;
import com.aurafit.repository.RentalOrderDetailRepository;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    @Override
    @Transactional(readOnly = true)
    public DashboardMetricsDTO getDashboardMetrics() {
        BigDecimal totalRevenue = rentalOrderRepository.calculateTotalRevenue();
        long totalOrders = rentalOrderRepository.count();
        long totalUsers = userRepository.countByRole(Role.CUSTOMER);
        long pendingOrdersCount = rentalOrderRepository.countByStatus(OrderStatus.PENDING);

        return new DashboardMetricsDTO(
                totalRevenue != null ? totalRevenue : BigDecimal.ZERO,
                totalOrders,
                totalUsers,
                pendingOrdersCount
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

        List<Object[]> results = rentalOrderRepository.getDailyRevenue(startDate, endDate);
        return results.stream()
                .map(row -> new RevenueChartDTO((String) row[0], (BigDecimal) row[1]))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopCostumeDTO> getTopCostumes(int limit) {
        return rentalOrderDetailRepository.findTopCostumes(PageRequest.of(0, limit));
    }
}
