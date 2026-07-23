package com.aurafit.business.order.controller;

import com.aurafit.business.order.dto.request.CheckoutRequest;
import com.aurafit.business.order.dto.request.HandoverImageUpdateRequest;
import com.aurafit.business.order.dto.request.PickupRequestDTO;
import com.aurafit.business.order.dto.request.ReturnRequestDTO;
import com.aurafit.common.dto.response.ApiResponse;
import com.aurafit.business.order.dto.response.CheckoutSessionResponse;
import com.aurafit.business.order.dto.response.HandoverRecordDTO;
import com.aurafit.business.order.dto.response.OrderResponse;
import com.aurafit.business.order.dto.response.OrderSummaryResponse;
import com.aurafit.business.order.dto.response.StaffOrderDetailResponse;
import com.aurafit.business.order.enums.HandoverType;
import com.aurafit.business.order.service.OrderService;
import com.aurafit.business.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "Order management endpoints for customers and staff")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService,
                           UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    // --- Customer Endpoints ---

    @PostMapping
    @Operation(summary = "Place a new rental order")
    public ResponseEntity<ApiResponse<CheckoutSessionResponse>> placeOrder(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequest request
    ) {
        Long userId = extractUserId(authentication);
        CheckoutSessionResponse response = orderService.placeOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully.", response, HttpStatus.CREATED));
    }

    @PostMapping("/{orderId}/extend")
    @Operation(summary = "Extend rental period for an order")
    public ResponseEntity<ApiResponse<OrderResponse>> extendRentalOrder(
            @PathVariable Long orderId,
            @RequestParam java.time.LocalDate newEndDate
    ) {
        return ResponseEntity.ok(ApiResponse.success("Order extended successfully.", orderService.extendRentalOrder(orderId, newEndDate)));
    }

    @GetMapping
    @Operation(summary = "List all orders for the authenticated user")
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> listOrders(Authentication authentication) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully.", orderService.getUserOrders(userId)));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get full detail of a specific order")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetail(
            Authentication authentication,
            @PathVariable Long orderId
    ) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Order detail retrieved.", orderService.getUserOrderDetail(orderId, userId)));
    }

    // --- Staff / Admin Endpoints ---

    @GetMapping("/management")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "List all orders for staff dashboard")
    public ResponseEntity<ApiResponse<List<StaffOrderDetailResponse>>> listStaffOrders() {
        return ResponseEntity.ok(ApiResponse.success("Staff orders retrieved.", orderService.getAllOrdersForStaff()));
    }

    @GetMapping("/{orderId}/management")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Get full staff view of a specific order")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> getStaffOrderDetail(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Staff order detail retrieved.", orderService.getOrderDetail(orderId)));
    }

    @PostMapping("/{orderId}/compensate")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Cancel an order and compensate the customer")
    public ResponseEntity<ApiResponse<OrderResponse>> compensateOrder(
            @PathVariable Long orderId,
            @RequestParam String reason
    ) {
        return ResponseEntity.ok(ApiResponse.success("Order cancelled and compensated.", orderService.compensateOrder(orderId, reason)));
    }

    @PostMapping("/{orderId}/pickup-handovers")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Record a pickup handover for an order")
    public ResponseEntity<ApiResponse<List<HandoverRecordDTO>>> createPickupHandover(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody PickupRequestDTO request
    ) {
        Long staffUserId = extractUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pickup handover recorded.", orderService.processPickupHandover(orderId, staffUserId, request), HttpStatus.CREATED));
    }

    @PostMapping("/{orderId}/return-handovers")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Record a return handover for an order")
    public ResponseEntity<ApiResponse<List<HandoverRecordDTO>>> createReturnHandover(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody ReturnRequestDTO request
    ) {
        Long staffUserId = extractUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Return handover recorded.", orderService.processReturnHandover(orderId, staffUserId, request), HttpStatus.CREATED));
    }

    @PatchMapping("/{orderId}/handovers/{handoverType}/image")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Update pickup/return handover evidence image")
    public ResponseEntity<ApiResponse<List<HandoverRecordDTO>>> updateHandoverImage(
            Authentication authentication,
            @PathVariable Long orderId,
            @PathVariable HandoverType handoverType,
            @Valid @RequestBody HandoverImageUpdateRequest request
    ) {
        Long staffUserId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Handover image updated.",
                orderService.updateHandoverImage(orderId, staffUserId, handoverType, request)
        ));
    }

    @PutMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            Authentication authentication,
            @PathVariable Long orderId,
            @RequestParam(required = false, defaultValue = "Khách hàng tự hủy") String cancelReason
    ) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(
                ApiResponse.success("Order cancelled successfully", orderService.cancelOrder(orderId, userId, cancelReason))
        );
    }

    // --- Private helpers ---

    private Long extractUserId(Authentication authentication) {
        return userService.getUserIdByEmail(authentication.getName());
    }
}
