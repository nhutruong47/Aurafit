package com.aurafit.cart.service.impl;

import com.aurafit.business.cart.dto.response.CartDTO;
import com.aurafit.business.cart.dto.response.CartItemDTO;
import com.aurafit.business.cart.entity.Cart;
import com.aurafit.business.cart.entity.CartItem;
import com.aurafit.business.cart.service.impl.CartServiceImpl;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeItem;
import com.aurafit.business.user.entity.User;
import com.aurafit.business.cart.enums.CartStatus;
import com.aurafit.business.cart.repository.CartItemRepository;
import com.aurafit.business.cart.repository.CartRepository;
import com.aurafit.business.catalog.repository.CostumeItemRepository;
import com.aurafit.business.user.repository.UserRepository;
import com.aurafit.business.catalog.service.EventPricingService;
import com.aurafit.interaction.service.InteractionEventRecorderService;
import com.aurafit.business.order.service.impl.PricingEngineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceImplDiscountTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private CostumeItemRepository costumeItemRepository;
    @Mock private UserRepository userRepository;
    @Mock private InteractionEventRecorderService interactionEventRecorderService;
    @Mock private EventPricingService eventPricingService;

    private CartServiceImpl cartService;

    @BeforeEach
    void setUp() {
        cartService = new CartServiceImpl(
                cartRepository,
                cartItemRepository,
                costumeItemRepository,
                userRepository,
                interactionEventRecorderService,
                new PricingEngineService(),
                eventPricingService
        );
    }

    @Test
    void getCart_shouldReturnLiveEventDiscountWithoutInflatingDeposit() {
        User user = new User();
        user.setId(1L);

        Costume costume = Costume.builder()
                .id(10L)
                .name("Áo dài ưu đãi")
                .rentalPrice(new BigDecimal("100000"))
                .depositPrice(new BigDecimal("500000"))
                .build();
        CostumeItem costumeItem = CostumeItem.builder()
                .id(20L)
                .sku("AF-AD-01")
                .size("M")
                .color("Đỏ")
                .costume(costume)
                .build();
        Cart cart = Cart.builder()
                .id(30L)
                .user(user)
                .status(CartStatus.ACTIVE)
                .build();
        CartItem cartItem = CartItem.builder()
                .id(40L)
                .cart(cart)
                .costumeItem(costumeItem)
                .rentalStartDate(LocalDate.now().plusDays(1))
                .rentalEndDate(LocalDate.now().plusDays(3))
                .rentalDays(2)
                .unitPrice(new BigDecimal("100000"))
                .rentalFee(new BigDecimal("100000"))
                .deposit(new BigDecimal("500000"))
                .subtotal(new BigDecimal("600000"))
                .build();
        cart.setItems(List.of(cartItem));

        when(cartRepository.findByUserIdAndStatusWithItems(1L, CartStatus.ACTIVE))
                .thenReturn(Optional.of(cart));
        when(eventPricingService.findActiveOffers(anyList(), any(LocalDateTime.class)))
                .thenReturn(Map.of(
                        costume.getId(),
                        new EventPricingService.ActiveEventOffer(
                                50L,
                                "Ưu đãi hè",
                                new BigDecimal("20"),
                                new BigDecimal("80000")
                        )
                ));
        when(costumeItemRepository.countPooledByCostumeIdAndSizeAndColor(
                costume.getId(),
                costumeItem.getSize(),
                costumeItem.getColor()
        )).thenReturn(1);

        CartDTO result = cartService.getCart(1L);
        CartItemDTO item = result.items().get(0);

        assertEquals(new BigDecimal("100000"), item.originalRentalFee());
        assertEquals(new BigDecimal("80000"), item.rentalFee());
        assertEquals(new BigDecimal("20000"), item.discountAmount());
        assertEquals(new BigDecimal("500000"), item.deposit());
        assertEquals(new BigDecimal("580000"), item.subtotal());
        assertEquals(new BigDecimal("20000"), result.totalDiscount());
        assertEquals(new BigDecimal("580000"), result.totalCartValue());
    }
}
