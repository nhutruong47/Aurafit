package com.aurafit.service.impl;

import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;
import com.aurafit.entity.RentalOrder;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final RentalOrderRepository rentalOrderRepository;

    public OrderServiceImpl(RentalOrderRepository rentalOrderRepository) {
        this.rentalOrderRepository = rentalOrderRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getUserOrders(Long userId) {
        List<RentalOrder> orders = rentalOrderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream()
                .map(OrderSummaryResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getUserOrderDetail(Long orderId, Long userId) {
        RentalOrder order = rentalOrderRepository.findByIdAndUserIdWithDetails(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return OrderResponse.fromEntity(order);
    }
}
