package com.aurafit.controller;

import com.aurafit.dto.request.AddToCartRequestDTO;
import com.aurafit.dto.request.UpdateCartItemRequestDTO;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.CartDTO;
import com.aurafit.service.CartService;
import com.aurafit.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Protected endpoints for managing the authenticated user's shopping cart.
 * The userId is NEVER taken from the request body — it is always extracted
 * from the SecurityContext (JWT) to prevent IDOR vulnerabilities.
 */
@RestController
@RequestMapping("/api/cart")
@Tag(name = "Shopping Cart", description = "Authenticated endpoints for cart management")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final CartService cartService;
    private final UserService userService;

    public CartController(CartService cartService, UserService userService) {
        this.cartService = cartService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Get current cart",
            description = "Returns the authenticated user's ACTIVE cart. Creates a new empty cart if none exists.")
    public ResponseEntity<ApiResponse<CartDTO>> getCart(Authentication authentication) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Cart retrieved successfully.", cartService.getCart(userId)));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart",
            description = "Adds a physical costume item to the cart with the specified rental period.")
    public ResponseEntity<ApiResponse<CartDTO>> addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequestDTO request
    ) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart.", cartService.addToCart(userId, request)));
    }

    @PutMapping("/items/{cartItemId}")
    @Operation(summary = "Update cart item",
            description = "Updates the rental dates of an existing CartItem and recalculates pricing.")
    public ResponseEntity<ApiResponse<CartDTO>> updateCartItem(
            Authentication authentication,
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequestDTO request
    ) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Cart item updated.", cartService.updateCartItem(userId, cartItemId, request)));
    }

    @DeleteMapping("/items/{cartItemId}")
    @Operation(summary = "Remove item from cart",
            description = "Removes a CartItem from the cart and recalculates the total.")
    public ResponseEntity<ApiResponse<CartDTO>> removeItemFromCart(
            Authentication authentication,
            @PathVariable Long cartItemId
    ) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart.", cartService.removeItemFromCart(userId, cartItemId)));
    }

    // ── Private helpers ──────────────────────────────────────────────────

    /**
     * Extracts the authenticated user's ID from the JWT SecurityContext.
     * The JWT subject contains the user's email, so we look up the User entity.
     * This ensures the userId is NEVER sourced from the frontend payload (anti-IDOR).
     */
    private Long extractUserId(Authentication authentication) {
        return userService.getUserIdByEmail(authentication.getName());
    }
}
