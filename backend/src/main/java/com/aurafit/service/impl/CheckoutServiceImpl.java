package com.aurafit.service.impl;

import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.OrderResponse;
import com.aurafit.entity.*;
import com.aurafit.enums.CartStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.ReturnStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.*;
import com.aurafit.service.CheckoutService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CheckoutServiceImpl implements CheckoutService {

    private final CartRepository cartRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;

    public CheckoutServiceImpl(CartRepository cartRepository,
                               RentalOrderRepository rentalOrderRepository,
                               CostumeItemRepository costumeItemRepository,
                               UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.rentalOrderRepository = rentalOrderRepository;
        this.costumeItemRepository = costumeItemRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest request) {

        // ── 1. Load user (fail-fast if deleted mid-session) ────────────────
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // ── 2. Load active cart with full item graph (JOIN FETCH — no N+1) ─
        Cart cart = cartRepository.findByUserIdAndStatusWithItems(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Khong tim thay gio hang ACTIVE nao."));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Gio hang cua ban dang trong. Vui long them san pham truoc.");
        }

        // ── 3. Concurrency stock check ─────────────────────────────────────
        // Ensures every item in the cart is still AVAILABLE before locking.
        // If any item was taken by another user, the order is rejected with SKU details.
        for (CartItem cartItem : cart.getItems()) {
            CostumeItem ci = cartItem.getCostumeItem();
            if (ci.getStatus() != ItemStatus.AVAILABLE) {
                throw new BadRequestException(
                        "San pham [SKU: " + ci.getSku() + "] khong con san. "
                        + "Trang thai hien tai: " + ci.getStatus()
                );
            }
        }

        // ── 4. Financial calculations using BigDecimal ──────────────────────
        // rental_price: sum of (price_per_day * rental_days) for all CartItems
        BigDecimal totalRentalPrice = cart.getItems().stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // deposit: sum of (costume.depositPrice * quantity) — quantity is always 1 per physical item
        BigDecimal totalDeposit = cart.getItems().stream()
                .map(ci -> ci.getCostumeItem().getCostume().getDepositPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discountAmount = BigDecimal.ZERO;

        // Determine rental period from cart items (all items in a cart share the same window)
        LocalDateTime rentalStartDate = cart.getItems().get(0)
                .getRentalStartDate().atStartOfDay();
        LocalDateTime rentalEndDate = cart.getItems().get(0)
                .getRentalEndDate().atTime(LocalTime.MAX);

        // ── 5. Build RentalOrder with cascade details ───────────────────────
        RentalOrder order = RentalOrder.builder()
                .user(user)
                .receiverName(request.receiverName())
                .receiverPhone(request.receiverPhone())
                .deliveryAddress(request.deliveryAddress())
                .totalRentalPrice(totalRentalPrice)
                .totalDeposit(totalDeposit)
                .discountAmount(discountAmount)
                .totalPrice(totalRentalPrice.subtract(discountAmount))
                .rentalStartDate(rentalStartDate)
                .rentalEndDate(rentalEndDate)
                .details(new ArrayList<>())
                .build();

        // Build each detail line and attach to the order (cascade = ALL persists automatically)
        for (CartItem cartItem : cart.getItems()) {
            Costume costume = cartItem.getCostumeItem().getCostume();
            RentalOrderDetail detail = RentalOrderDetail.builder()
                    .rentalOrder(order)
                    .costumeItem(cartItem.getCostumeItem())
                    .pricePerDay(costume.getRentalPrice())
                    .rentalDays(cartItem.getRentalDays())
                    .subtotal(cartItem.getSubtotal())
                    .deposit(costume.getDepositPrice())
                    .price(costume.getRentalPrice())
                    .returnStatus(ReturnStatus.NOT_RETURNED)
                    .build();
            order.getDetails().add(detail);
        }

        // ── 6. Persist order (cascades RentalOrderDetail via CascadeType.ALL) ─
        RentalOrder savedOrder = rentalOrderRepository.save(order);

        // ── 7. Mark all CostumeItems as RENTED (lock inventory) ─────────────
        List<Long> rentedItemIds = cart.getItems().stream()
                .map(ci -> ci.getCostumeItem().getId())
                .toList();
        costumeItemRepository.updateStatusByIds(rentedItemIds, ItemStatus.RENTED);

        // ── 8. Close the cart ───────────────────────────────────────────────
        cart.setStatus(CartStatus.CHECKED_OUT);
        cartRepository.save(cart);

        // ── 9. Re-fetch with full graph for the response DTO ───────────────
        // Eagerly load details + costumeItem + costume to avoid lazy-loading issues
        // outside the transaction boundary.
        RentalOrder responseOrder = rentalOrderRepository
                .findByIdWithDetailsAndCostumes(savedOrder.getId())
                .orElse(savedOrder);

        return OrderResponse.fromEntity(responseOrder);
    }
}
