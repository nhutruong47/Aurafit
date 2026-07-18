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
import com.aurafit.exception.BadRequestException;
import com.aurafit.repository.CartItemRepository;
import com.aurafit.repository.CartRepository;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.CartService;
import com.aurafit.service.InteractionEventRecorderService;
import com.aurafit.service.PricingEngineService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;
    private final InteractionEventRecorderService interactionEventRecorderService;
    private final PricingEngineService pricingEngineService;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           CostumeItemRepository costumeItemRepository,
                           UserRepository userRepository,
                           InteractionEventRecorderService interactionEventRecorderService,
                           PricingEngineService pricingEngineService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.costumeItemRepository = costumeItemRepository;
        this.userRepository = userRepository;
        this.interactionEventRecorderService = interactionEventRecorderService;
        this.pricingEngineService = pricingEngineService;
    }

    @Override
    @Transactional
    public CartDTO getCart(Long userId) {
        Cart cart = getOrCreateActiveCart(userId);
        return CartDTO.fromEntity(cart, costumeItemRepository);
    }

    @Override
    @Transactional
    public CartDTO addToCart(Long userId, AddToCartRequestDTO request) {
        // 1. Validate rental dates if present
        if (request.rentalStartDate() != null && request.rentalEndDate() != null) {
            if (!request.rentalEndDate().isAfter(request.rentalStartDate())) {
                throw new IllegalArgumentException("rentalEndDate must be after rentalStartDate");
            }
        }

        // 2. Fetch the CostumeItem with its parent Costume (single query via JOIN FETCH)
        CostumeItem referenceItem = costumeItemRepository.findByIdWithCostume(request.costumeItemId())
                .orElseThrow(() -> new ResourceNotFoundException("CostumeItem", "id", request.costumeItemId()));

        // 3. Get or create the user's active cart
        Cart cart = getOrCreateActiveCart(userId);

        // 4. Dynamic SKU Allocation & Verification
        int newQty = request.quantity() != null ? request.quantity() : 1;
        long totalAvailable = costumeItemRepository.countByCostumeIdAndSizeAndColorAndStatus(
                referenceItem.getCostume().getId(), referenceItem.getSize(), referenceItem.getColor(), ItemStatus.AVAILABLE);
        long existingQty = cartItemRepository.countVariantInCart(
                cart.getId(), referenceItem.getCostume().getId(), referenceItem.getSize(), referenceItem.getColor());

        if (existingQty + newQty > totalAvailable) {
            throw new BadRequestException("Vượt quá số lượng tồn kho. Bạn đã có " + existingQty + " sản phẩm này trong giỏ.");
        }

        // Fetch exactly `newQty` available items that are NOT already in the cart
        List<CostumeItem> itemsToAdd = costumeItemRepository.findAvailableItemsForUpdate(
                referenceItem.getCostume().getId(), referenceItem.getSize(), referenceItem.getColor(), ItemStatus.AVAILABLE,
                org.springframework.data.domain.PageRequest.of(0, (int) (existingQty + newQty))
        ).stream().filter(item -> !cartItemRepository.existsByCartIdAndCostumeItemId(cart.getId(), item.getId()))
          .limit(newQty)
          .toList();

        if (itemsToAdd.size() < newQty) {
            throw new BadRequestException("Không đủ sản phẩm trống để thêm vào giỏ hàng. Bạn đã có " + existingQty + " sản phẩm này trong giỏ.");
        }

        // 5. Calculate pricing via Tiered Pricing Engine
        int rentalDays = 0;
        if (request.rentalStartDate() != null && request.rentalEndDate() != null) {
            rentalDays = (int) java.time.temporal.ChronoUnit.DAYS.between(request.rentalStartDate(), request.rentalEndDate());
        }
        int effectiveDays = Math.max(1, rentalDays);
        BigDecimal unitPrice = referenceItem.getCostume().getRentalPrice();
        BigDecimal retailValue = referenceItem.getCostume().getDepositPrice(); // depositPrice = retail value

        // Per-item pricing (quantity = 1 per CartItem row since each row is 1 physical SKU)
        BigDecimal itemRentalFee = pricingEngineService.calculateItemRentalFee(unitPrice, effectiveDays, 1);
        BigDecimal itemDeposit = pricingEngineService.calculateItemDeposit(retailValue, itemRentalFee, 1);
        BigDecimal itemSubtotal = pricingEngineService.calculateTotal(itemRentalFee, itemDeposit);

        // 6. Create CartItems
        for (CostumeItem item : itemsToAdd) {
            CartItem cartItem = CartItem.builder()
                    .cart(cart)
                    .costumeItem(item)
                    .rentalStartDate(request.rentalStartDate())
                    .rentalEndDate(request.rentalEndDate())
                    .rentalDays(rentalDays > 0 ? rentalDays : null)
                    .unitPrice(unitPrice)
                    .rentalFee(itemRentalFee)
                    .deposit(itemDeposit)
                    .subtotal(itemSubtotal)
                    .build();
            cart.getItems().add(cartItem);
            recordAddToCartEvent(userId, item, cartItem, request);
        }

        cart.recalculateTotal();
        cartRepository.save(cart);

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

        interactionEventRecorderService.record(
                user,
                null,
                InteractionEventType.ADD_TO_CART,
                InteractionTargetType.CART,
                cartItem.getId() != null ? String.valueOf(cartItem.getId()) : null,
                "/cart",
                null,
                metadata
        );
    }

}
