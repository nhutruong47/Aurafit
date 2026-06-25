package com.aurafit.service;

import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;

import java.util.List;

public interface OrderService {

    List<OrderSummaryResponse> getUserOrders(Long userId);

    OrderResponse getUserOrderDetail(Long orderId, Long userId);
}
