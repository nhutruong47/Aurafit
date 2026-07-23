package com.aurafit.order.service.impl;

import com.aurafit.business.order.dto.request.CheckoutItemRequest;
import com.aurafit.business.order.dto.request.CheckoutRequest;
import com.aurafit.business.order.dto.response.CheckoutSessionResponse;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeItem;
import com.aurafit.business.order.entity.RentalOrder;
import com.aurafit.business.order.service.impl.OrderServiceImpl;
import com.aurafit.business.order.service.impl.PricingEngineService;
import com.aurafit.business.user.entity.User;
import com.aurafit.business.order.enums.DeliveryMethod;
import com.aurafit.business.cart.repository.CartItemRepository;
import com.aurafit.business.cart.repository.CartRepository;
import com.aurafit.business.catalog.repository.CostumeItemRepository;
import com.aurafit.business.order.repository.HandoverRecordRepository;
import com.aurafit.business.payment.repository.PaymentRepository;
import com.aurafit.business.order.repository.PromotionRepository;
import com.aurafit.business.order.repository.RentalOrderDetailRepository;
import com.aurafit.business.order.repository.RentalOrderRepository;
import com.aurafit.business.user.repository.UserRepository;
import com.aurafit.business.catalog.service.EventPricingService;
import com.aurafit.business.shipping.service.GhnIntegrationService;
import com.aurafit.business.interaction.service.InteractionEventRecorderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplDiscountTest {

    @Mock private RentalOrderRepository rentalOrderRepository;
    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private CostumeItemRepository costumeItemRepository;
    @Mock private UserRepository userRepository;
    @Mock private InteractionEventRecorderService interactionEventRecorderService;
    @Mock private HandoverRecordRepository handoverRecordRepository;
    @Mock private RentalOrderDetailRepository rentalOrderDetailRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private EventPricingService eventPricingService;
    @Mock private GhnIntegrationService ghnIntegrationService;
    @Mock private PromotionRepository promotionRepository;

    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderServiceImpl(
                rentalOrderRepository,
                cartRepository,
                cartItemRepository,
                costumeItemRepository,
                userRepository,
                interactionEventRecorderService,
                handoverRecordRepository,
                rentalOrderDetailRepository,
                paymentRepository,
                new PricingEngineService(),
                eventPricingService,
                ghnIntegrationService,
                promotionRepository
        );
    }

    @Test
    void placeOrder_shouldSnapshotActiveEventDiscountAndKeepDepositBasedOnGrossRental() {
        User user = new User();
        user.setId(1L);
        user.setEmail("customer@aurafit.vn");

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

        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = startDate.plusDays(2);
        CheckoutRequest request = new CheckoutRequest(
                "Khách AuraFit",
                "0900000000",
                "AuraFit Store",
                null,
                null,
                DeliveryMethod.STORE_PICKUP,
                BigDecimal.ZERO,
                List.of(new CheckoutItemRequest("AF-AD-01", 1, startDate, endDate))
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(costumeItemRepository.findBySku("AF-AD-01")).thenReturn(Optional.of(costumeItem));
        when(eventPricingService.findActiveOffers(anyList(), any(LocalDateTime.class)))
                .thenReturn(Map.of(
                        costume.getId(),
                        new EventPricingService.ActiveEventOffer(
                                30L,
                                "Ưu đãi hè",
                                new BigDecimal("20"),
                                new BigDecimal("80000")
                        )
                ));
        when(costumeItemRepository.findAvailableItemsWithBufferForUpdate(
                eq(costume.getId()),
                eq("M"),
                eq("Đỏ"),
                any(LocalDate.class),
                any(LocalDate.class),
                any(Pageable.class)
        )).thenReturn(List.of(costumeItem));
        when(rentalOrderRepository.save(any(RentalOrder.class))).thenAnswer(invocation -> {
            RentalOrder order = invocation.getArgument(0);
            order.setId(100L);
            return order;
        });

        CheckoutSessionResponse response = orderService.placeOrder(1L, request);

        ArgumentCaptor<RentalOrder> orderCaptor = ArgumentCaptor.forClass(RentalOrder.class);
        verify(rentalOrderRepository).save(orderCaptor.capture());
        RentalOrder savedOrder = orderCaptor.getValue();

        assertEquals(new BigDecimal("100000"), savedOrder.getTotalRentalPrice());
        assertEquals(new BigDecimal("20000"), savedOrder.getDiscountAmount());
        assertEquals(new BigDecimal("500000"), savedOrder.getTotalDeposit());
        assertEquals(new BigDecimal("580000"), savedOrder.getTotalPrice());
        assertEquals(new BigDecimal("580000"), response.getSessionTotalAmount());
        assertEquals(new BigDecimal("580000"), response.getOrders().get(0).finalAmount());
        assertEquals(new BigDecimal("100000"), response.getOrders().get(0).details().get(0).subtotal());
    }
}
