package com.aurafit.controller;

import com.aurafit.dto.StaffHandoverRequest;
import com.aurafit.dto.StaffRentalOrderResponse;
import com.aurafit.service.RentalOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
public class RentalOrderController {

    private final RentalOrderService rentalOrderService;

    @GetMapping("/staff")
    public List<StaffRentalOrderResponse> getStaffOrders() {
        return rentalOrderService.getStaffOrders();
    }

    @GetMapping("/staff/{orderId}")
    public StaffRentalOrderResponse getStaffOrder(@PathVariable Long orderId) {
        return rentalOrderService.getStaffOrder(orderId);
    }

    @PostMapping("/{orderId}/handover/pickup")
    public StaffRentalOrderResponse createPickupHandover(
            @PathVariable Long orderId,
            @Valid @RequestBody StaffHandoverRequest request
    ) {
        return rentalOrderService.createPickupHandover(orderId, request);
    }

    @PostMapping("/{orderId}/handover/return")
    public StaffRentalOrderResponse createReturnHandover(
            @PathVariable Long orderId,
            @Valid @RequestBody StaffHandoverRequest request
    ) {
        return rentalOrderService.createReturnHandover(orderId, request);
    }
}
