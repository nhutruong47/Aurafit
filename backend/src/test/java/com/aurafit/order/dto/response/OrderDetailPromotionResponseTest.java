package com.aurafit.order.dto.response;

import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeItem;
import com.aurafit.business.order.dto.response.OrderResponse;
import com.aurafit.business.order.dto.response.StaffOrderDetailResponse;
import com.aurafit.business.order.entity.RentalOrder;
import com.aurafit.business.order.entity.RentalOrderDetail;
import com.aurafit.business.order.enums.OrderStatus;
import com.aurafit.business.user.entity.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class OrderDetailPromotionResponseTest {

    @Test
    void orderResponses_shouldDeriveDiscountForLegacyDetailsWithoutEventSnapshot() {
        Costume costume = Costume.builder()
                .id(10L)
                .name("Trang phục ưu đãi")
                .build();
        CostumeItem costumeItem = CostumeItem.builder()
                .id(20L)
                .sku("AF-LEGACY-01")
                .size("M")
                .color("Đỏ")
                .costume(costume)
                .build();

        User user = new User();
        user.setId(30L);
        user.setFullName("Khách AuraFit");

        RentalOrder order = RentalOrder.builder()
                .id(40L)
                .user(user)
                .receiverName("Khách AuraFit")
                .totalRentalPrice(new BigDecimal("100000"))
                .discountAmount(new BigDecimal("20000"))
                .totalDeposit(new BigDecimal("500000"))
                .shippingFee(BigDecimal.ZERO)
                .status(OrderStatus.PENDING)
                .build();
        RentalOrderDetail detail = RentalOrderDetail.builder()
                .id(50L)
                .rentalOrder(order)
                .costumeItem(costumeItem)
                .pricePerDay(new BigDecimal("100000"))
                .rentalDays(1)
                .subtotal(new BigDecimal("100000"))
                .deposit(new BigDecimal("500000"))
                .price(new BigDecimal("580000"))
                .build();
        order.setDetails(List.of(detail));

        OrderResponse customerResponse = OrderResponse.fromEntity(order);
        StaffOrderDetailResponse staffResponse = StaffOrderDetailResponse.fromEntity(order, List.of());

        assertLegacyPromotion(customerResponse.details().get(0));
        assertEquals(new BigDecimal("20000"), staffResponse.discountAmount());
        assertEquals(new BigDecimal("100000"), staffResponse.details().get(0).subtotal());
        assertEquals(new BigDecimal("80000"), staffResponse.details().get(0).rentalFee());
        assertEquals(new BigDecimal("20000"), staffResponse.details().get(0).discountAmount());
        assertEquals(new BigDecimal("20.00"), staffResponse.details().get(0).discountPercent());
        assertNull(staffResponse.details().get(0).discountEventId());
        assertNull(staffResponse.details().get(0).discountEventName());
    }

    private void assertLegacyPromotion(OrderResponse.OrderDetailResponse detail) {
        assertEquals(new BigDecimal("100000"), detail.subtotal());
        assertEquals(new BigDecimal("80000"), detail.rentalFee());
        assertEquals(new BigDecimal("20000"), detail.discountAmount());
        assertEquals(new BigDecimal("20.00"), detail.discountPercent());
        assertNull(detail.discountEventId());
        assertNull(detail.discountEventName());
    }
}
