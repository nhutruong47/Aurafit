package com.aurafit.controller;

import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.CheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Protected endpoints for managing rental orders.
 * User identity is ALWAYS extracted from the JWT SecurityContext — never from
 * the request body — to prevent IDOR attacks.
 */
@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "Authenticated order management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final RentalOrderRepository rentalOrderRepository;
    private final UserRepository userRepository;

    public CheckoutController(CheckoutService checkoutService,
                               RentalOrderRepository rentalOrderRepository,
                               UserRepository userRepository) {
        this.checkoutService = checkoutService;
        this.rentalOrderRepository = rentalOrderRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/checkout")
    @Operation(
            summary = "Checkout — convert cart to order",
            description = "Fetches the authenticated user's ACTIVE cart, validates stock, "
                    + "locks inventory, creates a PENDING RentalOrder, and returns full order details."
    )
    public ResponseEntity<OrderResponse> checkout(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequest request
    ) {
        Long userId = extractUserId(authentication);
        OrderResponse response = checkoutService.checkout(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List all orders for the authenticated user")
    public ResponseEntity<List<OrderSummaryResponse>> listOrders(Authentication authentication) {
        Long userId = extractUserId(authentication);
        List<RentalOrder> orders = rentalOrderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<OrderSummaryResponse> summaries = orders.stream()
                .map(OrderSummaryResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get full detail of a specific order (owner only)")
    public ResponseEntity<OrderResponse> getOrderDetail(
            Authentication authentication,
            @PathVariable Long orderId
    ) {
        Long userId = extractUserId(authentication);
        RentalOrder order = rentalOrderRepository.findByIdAndUserIdWithDetails(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Long extractUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }
}
