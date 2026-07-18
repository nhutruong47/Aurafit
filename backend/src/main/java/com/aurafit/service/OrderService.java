package com.aurafit.service;

import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;
import com.aurafit.dto.response.StaffOrderDetailResponse;

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

    List<StaffOrderDetailResponse> getAllOrdersForStaff();

    // Admin/Staff Order Management
    org.springframework.data.domain.Page<StaffOrderDetailResponse> getAllOrdersForAdmin(
            org.springframework.data.domain.Pageable pageable,
            com.aurafit.enums.OrderStatus status,
            String keyword
    );
    void shipOrder(Long orderId);
    void markOrderRented(Long orderId);
    void markOrderReturned(Long orderId);
    void returnOrder(Long orderId);
    void completeOrder(Long orderId, com.aurafit.dto.request.InspectionRequest request);
    void handleDeliveryFailed(Long orderId, String reason);
    void handleLostPackage(Long orderId, String reason);
    void reportInvalidBank(Long orderId);

    StaffOrderDetailResponse getOrderDetail(Long orderId);

    OrderResponse cancelOrder(Long orderId, Long userId, String cancelReason);

    /**
     * Process order pickup handover.
     */
    List<com.aurafit.dto.response.HandoverRecordDTO> processPickupHandover(Long orderId, Long staffId, com.aurafit.dto.request.PickupRequestDTO request);

    /**
     * Process order return handover.
     */
    List<com.aurafit.dto.response.HandoverRecordDTO> processReturnHandover(Long orderId, Long staffId, com.aurafit.dto.request.ReturnRequestDTO request);

    List<com.aurafit.dto.response.HandoverRecordDTO> updateHandoverImage(
            Long orderId,
            Long staffId,
            com.aurafit.enums.HandoverType handoverType,
            com.aurafit.dto.request.HandoverImageUpdateRequest request
    );
}
