package com.aurafit.business.cart.entity;

import com.aurafit.business.catalog.entity.CostumeItem;
import com.aurafit.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "cart_items", indexes = {
        @Index(name = "idx_cart_items_cart_id_costume_item_id", columnList = "cart_id, costume_item_id"),
        @Index(name = "idx_cart_items_costume_item_id", columnList = "costume_item_id")
})
public class CartItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_item_id", nullable = false)
    private CostumeItem costumeItem;

    @Column(name = "rental_start_date")
    private LocalDate rentalStartDate;

    @Column(name = "rental_end_date")
    private LocalDate rentalEndDate;

    @Column(name = "rental_days")
    private Integer rentalDays;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Builder.Default
    @Column(name = "rental_fee", nullable = false, columnDefinition = "numeric(38,2) default 0")
    private BigDecimal rentalFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "deposit", nullable = false, columnDefinition = "numeric(38,2) default 0")
    private BigDecimal deposit = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal subtotal;
}
