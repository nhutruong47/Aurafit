package com.aurafit.controller;

import com.aurafit.dto.request.HandoverRequest;
import com.aurafit.dto.response.HandoverRecordDTO;
import com.aurafit.dto.response.StaffOrderDetailResponse;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.StaffService;
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
@Tag(name = "Staff", description = "Staff & Admin order management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class StaffController {

    private final StaffService staffService;
    private final UserRepository userRepository;

    public StaffController(StaffService staffService, UserRepository userRepository) {
        this.staffService = staffService;
        this.userRepository = userRepository;
    }

    @GetMapping("/staff")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "List all orders for staff dashboard")
    public ResponseEntity<List<StaffOrderDetailResponse>> listStaffOrders() {
        return ResponseEntity.ok(staffService.getAllOrdersForStaff());
    }

    @GetMapping("/staff/{orderId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Get full staff view of a specific order")
    public ResponseEntity<StaffOrderDetailResponse> getStaffOrderDetail(@PathVariable Long orderId) {
        return ResponseEntity.ok(staffService.getOrderDetail(orderId));
    }

    @PostMapping("/{orderId}/handover/pickup")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Record a pickup handover")
    public ResponseEntity<HandoverRecordDTO> createPickupHandover(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody HandoverRequest request
    ) {
        Long staffUserId = extractStaffUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffService.createPickupHandover(staffUserId, orderId, request));
    }

    @PostMapping("/{orderId}/handover/return")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Record a return handover")
    public ResponseEntity<HandoverRecordDTO> createReturnHandover(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody HandoverRequest request
    ) {
        Long staffUserId = extractStaffUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffService.createReturnHandover(staffUserId, orderId, request));
    }

    private Long extractStaffUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }
}
