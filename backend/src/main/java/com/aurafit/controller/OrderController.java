package com.aurafit.controller;

import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.request.HandoverRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.HandoverRecordDTO;
import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;
import com.aurafit.dto.response.StaffOrderDetailResponse;
import com.aurafit.service.OrderService;
import com.aurafit.service.StaffService;
import com.aurafit.service.UserService;
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
    private final StaffService staffService;
    private final UserService userService;

    public OrderController(OrderService orderService,
                           StaffService staffService,
                           UserService userService) {
        this.orderService = orderService;
        this.staffService = staffService;
        this.userService = userService;
    }

    // --- Customer Endpoints ---

    @PostMapping
    @Operation(summary = "Place a new rental order")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequest request
    ) {
        Long userId = extractUserId(authentication);
        OrderResponse response = orderService.placeOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully.", response, HttpStatus.CREATED));
    }

    @GetMapping
    @Operation(summary = "List all orders for the authenticated user")
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> listOrders(Authentication authentication) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully.", orderService.getUserOrders(userId)));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get full detail of a specific order (owner only)")
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
        return ResponseEntity.ok(ApiResponse.success("Staff orders retrieved.", staffService.getAllOrdersForStaff()));
    }

    @GetMapping("/{orderId}/management")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Get full staff view of a specific order")
    public ResponseEntity<ApiResponse<StaffOrderDetailResponse>> getStaffOrderDetail(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Staff order detail retrieved.", staffService.getOrderDetail(orderId)));
    }

    @PostMapping("/{orderId}/pickup-handovers")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Record a pickup handover")
    public ResponseEntity<ApiResponse<HandoverRecordDTO>> createPickupHandover(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody HandoverRequest request
    ) {
        Long staffUserId = extractUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pickup handover recorded.", staffService.createPickupHandover(staffUserId, orderId, request), HttpStatus.CREATED));
    }

    @PostMapping("/{orderId}/return-handovers")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Record a return handover")
    public ResponseEntity<ApiResponse<HandoverRecordDTO>> createReturnHandover(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody HandoverRequest request
    ) {
        Long staffUserId = extractUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Return handover recorded.", staffService.createReturnHandover(staffUserId, orderId, request), HttpStatus.CREATED));
    }

    // --- Private helpers ---

    private Long extractUserId(Authentication authentication) {
        return userService.getUserIdByEmail(authentication.getName());
    }
}
