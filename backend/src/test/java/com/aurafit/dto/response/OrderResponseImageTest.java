package com.aurafit.dto.response;

import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeImage;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import com.aurafit.entity.User;
import com.aurafit.enums.OrderStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OrderResponseImageTest {

    @Test
    void customerOrderResponses_shouldExposePrimaryCostumeImage() {
        Costume costume = Costume.builder()
                .id(10L)
                .name("Áo dài")
                .rentalPrice(new BigDecimal("100000"))
                .depositPrice(new BigDecimal("500000"))
                .build();
        CostumeImage secondaryImage = CostumeImage.builder()
                .id(11L)
                .costume(costume)
                .imageUrl("https://cdn.example.com/secondary.jpg")
                .displayOrder(2)
                .primary(false)
                .build();
        CostumeImage primaryImage = CostumeImage.builder()
                .id(12L)
                .costume(costume)
                .imageUrl("https://cdn.example.com/primary.jpg")
                .displayOrder(1)
                .primary(true)
                .build();
        costume.setImages(List.of(secondaryImage, primaryImage));

        CostumeItem costumeItem = CostumeItem.builder()
                .id(20L)
                .sku("AF-AD-01")
                .size("M")
                .color("Đỏ")
                .costume(costume)
                .build();

        User user = new User();
        user.setId(30L);
        user.setConsecutiveCancelCount(0);

        RentalOrder order = RentalOrder.builder()
                .id(40L)
                .user(user)
                .receiverName("Khách AuraFit")
                .receiverPhone("0900000000")
                .deliveryAddress("AuraFit Store")
                .totalRentalPrice(new BigDecimal("100000"))
                .totalDeposit(new BigDecimal("500000"))
                .totalPrice(new BigDecimal("600000"))
                .status(OrderStatus.PENDING)
                .build();
        RentalOrderDetail detail = RentalOrderDetail.builder()
                .id(50L)
                .rentalOrder(order)
                .costumeItem(costumeItem)
                .pricePerDay(new BigDecimal("100000"))
                .rentalDays(1)
                .rentalStartDate(LocalDate.now().plusDays(1))
                .rentalEndDate(LocalDate.now().plusDays(2))
                .subtotal(new BigDecimal("100000"))
                .deposit(new BigDecimal("500000"))
                .price(new BigDecimal("600000"))
                .build();
        order.setDetails(List.of(detail));

        OrderResponse detailResponse = OrderResponse.fromEntity(order);
        OrderSummaryResponse summaryResponse = OrderSummaryResponse.fromEntity(order);

        assertEquals(costume.getId(), detailResponse.details().get(0).costumeId());
        assertEquals("https://cdn.example.com/primary.jpg", detailResponse.details().get(0).imageUrl());
        assertEquals(
                List.of("https://cdn.example.com/primary.jpg", "https://cdn.example.com/secondary.jpg"),
                detailResponse.details().get(0).imageUrls()
        );
        assertEquals("https://cdn.example.com/primary.jpg", summaryResponse.imageUrl());
    }
}
