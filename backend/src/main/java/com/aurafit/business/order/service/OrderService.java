package com.aurafit.business.order.service;

import com.aurafit.business.order.dto.request.HandoverImageUpdateRequest;
import com.aurafit.business.order.dto.request.InspectionRequest;
import com.aurafit.business.order.dto.request.PickupRequestDTO;
import com.aurafit.business.order.dto.request.ReturnRequestDTO;
import com.aurafit.business.order.dto.response.HandoverRecordDTO;
import com.aurafit.business.order.enums.HandoverType;
import com.aurafit.business.order.enums.OrderStatus;
import com.aurafit.business.order.dto.request.CheckoutRequest;
import com.aurafit.business.order.dto.response.CheckoutSessionResponse;
import com.aurafit.business.order.dto.response.OrderResponse;
import com.aurafit.business.order.dto.response.OrderSummaryResponse;
import com.aurafit.business.order.dto.response.StaffOrderDetailResponse;

import java.time.LocalDate;
import java.util.List;

public interface OrderService {

    /**
     * Creates a PENDING rental order from a list of items.
     *
     * @param userId  Always extracted from SecurityContext — never from request body.
     * @param request Contains receiver info and a non-empty list of checkout items.
     * @return Full order details including line items and computed totals.
     */
    CheckoutSessionResponse placeOrder(Long userId, CheckoutRequest request);

    OrderResponse extendRentalOrder(Long orderId, LocalDate newEndDate);

    OrderResponse compensateOrder(Long orderId, String reason);

    List<OrderSummaryResponse> getUserOrders(Long userId);

    OrderResponse getUserOrderDetail(Long orderId, Long userId);

    List<StaffOrderDetailResponse> getAllOrdersForStaff();

    // Admin/Staff Order Management
    org.springframework.data.domain.Page<StaffOrderDetailResponse> getAllOrdersForAdmin(
            org.springframework.data.domain.Pageable pageable,
            OrderStatus status,
            String keyword
    );
    void shipOrder(Long orderId);
    void markOrderRented(Long orderId);
    void markOrderReturned(Long orderId);
    void returnOrder(Long orderId);
    void completeOrder(Long orderId, InspectionRequest request);
    void handleDeliveryFailed(Long orderId, String reason);
    void handleLostPackage(Long orderId, String reason);
    void reportInvalidBank(Long orderId);

    StaffOrderDetailResponse getOrderDetail(Long orderId);

    OrderResponse cancelOrder(Long orderId, Long userId, String cancelReason);

    /**
     * Process order pickup handover.
     */
    List<HandoverRecordDTO> processPickupHandover(Long orderId, Long staffId, PickupRequestDTO request);

    /**
     * Process order return handover.
     */
    List<HandoverRecordDTO> processReturnHandover(Long orderId, Long staffId, ReturnRequestDTO request);

    List<HandoverRecordDTO> updateHandoverImage(
            Long orderId,
            Long staffId,
            HandoverType handoverType,
            HandoverImageUpdateRequest request
    );
}
