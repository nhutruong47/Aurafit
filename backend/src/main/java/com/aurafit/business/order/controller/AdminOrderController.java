package com.aurafit.business.order.controller;

import com.aurafit.business.order.dto.request.InspectionRequest;
import com.aurafit.common.dto.response.ApiResponse;
import com.aurafit.business.order.dto.response.StaffOrderDetailResponse;
import com.aurafit.business.order.enums.OrderStatus;
import com.aurafit.business.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixDbConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE rental_orders DROP CONSTRAINT IF EXISTS rental_orders_status_check;");
            jdbcTemplate.execute("ALTER TABLE rental_orders DROP CONSTRAINT IF EXISTS rental_orders_status_check1;");
            System.out.println("Dropped rental_orders_status_check constraint!");
        } catch(Exception e) {
            e.printStackTrace();
        }
    }

    @GetMapping("/statuses")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, String>>>> getOrderStatuses() {
        java.util.Map<String, String> statusLabels = java.util.Map.ofEntries(
            java.util.Map.entry("PENDING", "Chờ xác nhận"),
            java.util.Map.entry("CONFIRMED", "Đã xác nhận"),
            java.util.Map.entry("SHIPPING", "Đang giao hàng"),
            java.util.Map.entry("RENTED", "Đang thuê"),
            java.util.Map.entry("RETURNING", "Đang hoàn trả"),
            java.util.Map.entry("RETURNED", "Đã trả đồ"),
            java.util.Map.entry("PENDING_REFUND", "Chờ giải ngân"),
            java.util.Map.entry("COMPLETED", "Hoàn thành"),
            java.util.Map.entry("PICKED_UP", "Khách đã lấy hàng"),
            java.util.Map.entry("CANCELLED", "Đã hủy")
        );

        java.util.List<java.util.Map<String, String>> statuses = java.util.Arrays.stream(OrderStatus.values())
                .map(status -> java.util.Map.of(
                        "value", status.name(), 
                        "label", statusLabels.getOrDefault(status.name(), status.name())
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Fetched order statuses successfully", statuses));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<StaffOrderDetailResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String keyword) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<StaffOrderDetailResponse> orders = orderService.getAllOrdersForAdmin(pageable, status, keyword);
        return ResponseEntity.ok(ApiResponse.success("Fetched all orders successfully", orders));
    }

    @PostMapping("/{id}/ship")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> shipOrder(@PathVariable Long id) {
        orderService.shipOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Order marked as SHIPPING and GHN forward order created", (Void) null));
    }

    @PostMapping("/{id}/mark-rented")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> markOrderRented(@PathVariable Long id) {
        orderService.markOrderRented(id);
        return ResponseEntity.ok(ApiResponse.success("Order items marked as RENTED", (Void) null));
    }

    @PostMapping("/{id}/mark-returned")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> markOrderReturned(@PathVariable Long id) {
        orderService.markOrderReturned(id);
        return ResponseEntity.ok(ApiResponse.success("Order marked as RETURNED", (Void) null));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> returnOrder(@PathVariable Long id) {
        orderService.returnOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Order marked as RETURNING and GHN return order created", (Void) null));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> completeOrder(
            @PathVariable Long id,
            @Valid @RequestBody InspectionRequest request
    ) {
        orderService.completeOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as COMPLETED and deposits refunded", (Void) null));
    }

    @PostMapping("/{id}/delivery-failed")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> handleDeliveryFailed(@PathVariable Long id, @RequestParam String reason) {
        orderService.handleDeliveryFailed(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Order marked as CANCELLED (Delivery Failed)", (Void) null));
    }

    @PostMapping("/{id}/lost-package")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> handleLostPackage(@PathVariable Long id, @RequestParam String reason) {
        orderService.handleLostPackage(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Order marked as CANCELLED (Lost Package)", (Void) null));
    }

    @PostMapping("/{id}/report-invalid-bank")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> reportInvalidBank(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) InspectionRequest request
    ) {
        orderService.reportInvalidBank(id, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as PENDING_REFUND due to invalid bank info", (Void) null));
    }
}
