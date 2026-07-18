package com.aurafit.controller;

import com.aurafit.dto.request.InspectionRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.StaffOrderDetailResponse;
import com.aurafit.enums.OrderStatus;
import com.aurafit.service.OrderService;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<StaffOrderDetailResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) OrderStatus status) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<StaffOrderDetailResponse> orders = orderService.getAllOrdersForAdmin(pageable, status);
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
    public ResponseEntity<ApiResponse<Void>> completeOrder(@PathVariable Long id, @RequestBody InspectionRequest request) {
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
}
