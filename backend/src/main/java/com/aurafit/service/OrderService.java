package com.aurafit.service;

import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;

import java.util.List;

public interface OrderService {

    /**
     * Creates a PENDING rental order from a list of items.
     *
     * @param userId  Always extracted from SecurityContext — never from request body.
     * @param request Contains receiver info and a non-empty list of checkout items.
     * @return Full order details including line items and computed totals.
     */
    OrderResponse placeOrder(Long userId, CheckoutRequest request);

    List<OrderSummaryResponse> getUserOrders(Long userId);

    OrderResponse getUserOrderDetail(Long orderId, Long userId);

    OrderResponse cancelOrder(Long orderId, Long userId);

    /**
     * Process order pickup handover.
     */
    List<com.aurafit.dto.response.HandoverRecordDTO> processPickupHandover(Long orderId, Long staffId, com.aurafit.dto.request.PickupRequestDTO request);

    /**
     * Process order return handover.
     */
    List<com.aurafit.dto.response.HandoverRecordDTO> processReturnHandover(Long orderId, Long staffId, com.aurafit.dto.request.ReturnRequestDTO request);
}
