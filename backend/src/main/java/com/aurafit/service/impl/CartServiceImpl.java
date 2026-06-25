package com.aurafit.service.impl;

import com.aurafit.dto.request.AddToCartRequestDTO;
import com.aurafit.dto.response.CartDTO;
import com.aurafit.entity.Cart;
import com.aurafit.entity.CartItem;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.User;
import com.aurafit.enums.CartStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ConflictException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CartItemRepository;
import com.aurafit.repository.CartRepository;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.BehaviorTrackingService;
import com.aurafit.service.CartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;
    private final BehaviorTrackingService behaviorTrackingService;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           CostumeItemRepository costumeItemRepository,
                           UserRepository userRepository,
                           BehaviorTrackingService behaviorTrackingService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.costumeItemRepository = costumeItemRepository;
        this.userRepository = userRepository;
        this.behaviorTrackingService = behaviorTrackingService;
    }

    @Override
    @Transactional(readOnly = true)
    public CartDTO getCart(Long userId) {
        Cart cart = getOrCreateActiveCart(userId);
        return CartDTO.fromEntity(cart);
    }

    @Override
    @Transactional
    public CartDTO addToCart(Long userId, AddToCartRequestDTO request) {
        // 1. Validate rental dates
        if (!request.rentalEndDate().isAfter(request.rentalStartDate())) {
            throw new BadRequestException("rentalEndDate must be after rentalStartDate");
        }

        // 2. Fetch the CostumeItem with its parent Costume (single query via JOIN FETCH)
        CostumeItem costumeItem = costumeItemRepository.findByIdWithCostume(request.costumeItemId())
                .orElseThrow(() -> new ResourceNotFoundException("CostumeItem", "id", request.costumeItemId()));

        // 3. Validate item availability
        if (costumeItem.getStatus() != ItemStatus.AVAILABLE) {
            throw new ConflictException(
                    "CostumeItem [SKU: " + costumeItem.getSku() + "] is currently " + costumeItem.getStatus()
                            + " and cannot be added to cart");
        }

        // 4. Get or create the user's active cart
        Cart cart = getOrCreateActiveCart(userId);

        // 5. Prevent duplicate items in the same cart
        if (cartItemRepository.existsByCartIdAndCostumeItemId(cart.getId(), costumeItem.getId())) {
            throw new ConflictException(
                    "CostumeItem [SKU: " + costumeItem.getSku() + "] is already in your cart");
        }

        // 6. Calculate pricing
        long rentalDays = ChronoUnit.DAYS.between(request.rentalStartDate(), request.rentalEndDate());
        BigDecimal unitPrice = costumeItem.getCostume().getRentalPrice();
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(rentalDays));

        // 7. Build and persist CartItem
        CartItem cartItem = CartItem.builder()
                .cart(cart)
                .costumeItem(costumeItem)
                .rentalStartDate(request.rentalStartDate())
                .rentalEndDate(request.rentalEndDate())
                .rentalDays((int) rentalDays)
                .unitPrice(unitPrice)
                .subtotal(subtotal)
                .build();

        cart.getItems().add(cartItem);
        cart.recalculateTotal();
        cartRepository.save(cart);

        // 8. Re-fetch with full JOIN FETCH graph for the response DTO
        Cart refreshedCart = cartRepository.findByUserIdAndStatusWithItems(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));
        behaviorTrackingService.recordAddToCart(cart.getUser(), costumeItem.getCostume().getId(), "cart-service");

        return CartDTO.fromEntity(refreshedCart);
    }

    @Override
    @Transactional
    public CartDTO removeItemFromCart(Long userId, Long cartItemId) {
        Cart cart = cartRepository.findByUserIdAndStatusWithItems(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));

        // Find and remove the CartItem from the list (orphanRemoval = true will delete the DB row)
        boolean removed = cart.getItems().removeIf(item -> item.getId().equals(cartItemId));

        if (!removed) {
            throw new ResourceNotFoundException("CartItem", "id", cartItemId);
        }

        cart.recalculateTotal();
        cartRepository.save(cart);

        return CartDTO.fromEntity(cart);
    }

    // ── Private helpers ──────────────────────────────────────────────────

    /**
     * Retrieves the user's ACTIVE cart. If none exists, creates a new empty one.
     * Uses JOIN FETCH to load the full item graph in a single query.
     */
    private Cart getOrCreateActiveCart(Long userId) {
        return cartRepository.findByUserIdAndStatusWithItems(userId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

                    Cart newCart = Cart.builder()
                            .user(user)
                            .status(CartStatus.ACTIVE)
                            .build();

                    return cartRepository.save(newCart);
                });
    }
}
