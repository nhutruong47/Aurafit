package com.aurafit.controller;

import com.aurafit.dto.request.AddToCartRequestDTO;
import com.aurafit.dto.response.CartDTO;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.CartService;
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
public class    CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    public CartController(CartService cartService, UserRepository userRepository) {
        this.cartService = cartService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "Get current cart",
            description = "Returns the authenticated user's ACTIVE cart. Creates a new empty cart if none exists.")
    public ResponseEntity<CartDTO> getCart(Authentication authentication) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @PostMapping("/add")
    @Operation(summary = "Add item to cart",
            description = "Adds a physical costume item to the cart with the specified rental period.")
    public ResponseEntity<CartDTO> addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequestDTO request
    ) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(cartService.addToCart(userId, request));
    }

    @DeleteMapping("/remove/{cartItemId}")
    @Operation(summary = "Remove item from cart",
            description = "Removes a CartItem from the cart and recalculates the total.")
    public ResponseEntity<CartDTO> removeItemFromCart(
            Authentication authentication,
            @PathVariable Long cartItemId
    ) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(cartService.removeItemFromCart(userId, cartItemId));
    }

    // ── Private helpers ──────────────────────────────────────────────────

    /**
     * Extracts the authenticated user's ID from the JWT SecurityContext.
     * The JWT subject contains the user's email, so we look up the User entity.
     * This ensures the userId is NEVER sourced from the frontend payload (anti-IDOR).
     */
    private Long extractUserId(Authentication authentication) {
        String email = authentication.getName(); // JWT subject = email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }
}
