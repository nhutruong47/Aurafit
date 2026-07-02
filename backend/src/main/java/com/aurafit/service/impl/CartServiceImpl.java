package com.aurafit.service.impl;

import com.aurafit.dto.request.AddToCartRequestDTO;
import com.aurafit.dto.request.UpdateCartItemRequestDTO;
import com.aurafit.dto.response.CartDTO;
import com.aurafit.entity.Cart;
import com.aurafit.entity.CartItem;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.User;
import com.aurafit.enums.CartStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;
import com.aurafit.enums.ItemStatus;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CartItemRepository;
import com.aurafit.repository.CartRepository;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.CartService;
import com.aurafit.service.InteractionEventRecorderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;
    private final InteractionEventRecorderService interactionEventRecorderService;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           CostumeItemRepository costumeItemRepository,
                           UserRepository userRepository,
                           InteractionEventRecorderService interactionEventRecorderService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.costumeItemRepository = costumeItemRepository;
        this.userRepository = userRepository;
        this.interactionEventRecorderService = interactionEventRecorderService;
    }

    @Override
    @Transactional(readOnly = true)
    public CartDTO getCart(Long userId) {
        Cart cart = getOrCreateActiveCart(userId);
        return CartDTO.fromEntity(cart, costumeItemRepository);
    }

    @Override
    @Transactional
    public CartDTO addToCart(Long userId, AddToCartRequestDTO request) {
        // 1. Validate rental dates
        if (!request.rentalEndDate().isAfter(request.rentalStartDate())) {
            throw new IllegalArgumentException("rentalEndDate must be after rentalStartDate");
        }

        // 2. Fetch the CostumeItem with its parent Costume (single query via JOIN FETCH)
        CostumeItem costumeItem = costumeItemRepository.findByIdWithCostume(request.costumeItemId())
                .orElseThrow(() -> new ResourceNotFoundException("CostumeItem", "id", request.costumeItemId()));

        // 3. Validate item availability
        if (costumeItem.getStatus() != ItemStatus.AVAILABLE) {
            throw new IllegalStateException(
                    "CostumeItem [SKU: " + costumeItem.getSku() + "] is currently " + costumeItem.getStatus()
                            + " and cannot be added to cart");
        }

        // 4. Get or create the user's active cart
        Cart cart = getOrCreateActiveCart(userId);

        // 5. Prevent duplicate items in the same cart
        if (cartItemRepository.existsByCartIdAndCostumeItemId(cart.getId(), costumeItem.getId())) {
            throw new IllegalStateException(
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
        recordAddToCartEvent(userId, costumeItem, cartItem, request);

        // 8. Re-fetch with full JOIN FETCH graph for the response DTO
        Cart refreshedCart = cartRepository.findByUserIdAndStatusWithItems(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));

        return CartDTO.fromEntity(refreshedCart, costumeItemRepository);
    }

    @Override
    @Transactional
    public CartDTO updateCartItem(Long userId, Long cartItemId, UpdateCartItemRequestDTO request) {
        // 1. Validate rental dates
        if (!request.rentalEndDate().isAfter(request.rentalStartDate())) {
            throw new IllegalArgumentException("rentalEndDate must be after rentalStartDate");
        }

        // 2. Fetch the user's active cart with items
        Cart cart = cartRepository.findByUserIdAndStatusWithItems(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));

        // 3. Find the specific CartItem within the user's cart (prevents IDOR)
        CartItem cartItem = cart.getItems().stream()
                .filter(item -> item.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        // 4. Recalculate pricing with the new dates
        long rentalDays = ChronoUnit.DAYS.between(request.rentalStartDate(), request.rentalEndDate());
        BigDecimal unitPrice = cartItem.getCostumeItem().getCostume().getRentalPrice();
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(rentalDays));

        // 5. Update fields
        cartItem.setRentalStartDate(request.rentalStartDate());
        cartItem.setRentalEndDate(request.rentalEndDate());
        cartItem.setRentalDays((int) rentalDays);
        cartItem.setUnitPrice(unitPrice);
        cartItem.setSubtotal(subtotal);

        // 6. Recalculate cart total and persist
        cart.recalculateTotal();
        cartRepository.save(cart);

        // 7. Re-fetch with full JOIN FETCH graph for the response DTO
        Cart refreshedCart = cartRepository.findByUserIdAndStatusWithItems(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));

        return CartDTO.fromEntity(refreshedCart, costumeItemRepository);
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

        return CartDTO.fromEntity(cart, costumeItemRepository);
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

    private void recordAddToCartEvent(Long userId,
                                      CostumeItem costumeItem,
                                      CartItem cartItem,
                                      AddToCartRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("costumeItemId", costumeItem.getId());
        metadata.put("costumeId", costumeItem.getCostume() != null ? costumeItem.getCostume().getId() : null);
        metadata.put("sku", costumeItem.getSku());
        metadata.put("rentalStartDate", request.rentalStartDate() != null ? request.rentalStartDate().toString() : null);
        metadata.put("rentalEndDate", request.rentalEndDate() != null ? request.rentalEndDate().toString() : null);
        metadata.put("category", costumeItem.getCostume() != null && costumeItem.getCostume().getCategory() != null
                ? costumeItem.getCostume().getCategory().getName()
                : null);

        if (request.aiStylistAttribution() != null) {
            metadata.put("aiStylistAttribution", buildAiStylistAttribution(request.aiStylistAttribution()));
        }

        interactionEventRecorderService.record(
                user,
                request.aiStylistAttribution() != null ? request.aiStylistAttribution().interactionSessionId() : null,
                InteractionEventType.ADD_TO_CART,
                InteractionTargetType.CART,
                cartItem.getId() != null ? String.valueOf(cartItem.getId()) : null,
                "/cart",
                null,
                metadata
        );
    }

    private Map<String, Object> buildAiStylistAttribution(com.aurafit.dto.request.AiStylistAttributionRequest attribution) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("source", "AI_STYLIST");
        metadata.put("slot", "ai_stylist_chat");
        metadata.put("interactionSessionId", attribution.interactionSessionId());
        metadata.put("aiStylistSessionId", attribution.aiStylistSessionId());
        metadata.put("aiStylistMessageId", attribution.aiStylistMessageId());
        metadata.put("guestSessionId", attribution.guestSessionId());
        metadata.put("recommendationPosition", attribution.recommendationPosition());
        metadata.put("recommendationReason", attribution.recommendationReason());
        return metadata;
    }
}
