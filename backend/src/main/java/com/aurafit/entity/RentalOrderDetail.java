package com.aurafit.entity;

import com.aurafit.enums.ReturnStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "rental_order_details", indexes = {
        @Index(name = "idx_rental_order_details_rental_order_id", columnList = "rental_order_id"),
        @Index(name = "idx_rental_order_details_costume_item_id_rental_order_id", columnList = "costume_item_id, rental_order_id")
})
public class RentalOrderDetail extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_id", nullable = false)
    private RentalOrder rentalOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_item_id", nullable = false)
    private CostumeItem costumeItem;

    @Column(name = "price_per_day", nullable = false)
    private BigDecimal pricePerDay;

    @Column(name = "rental_days", nullable = false)
    private int rentalDays;

    @Column(name = "rental_start_date")
    private LocalDate rentalStartDate;

    @Column(name = "rental_end_date")
    private LocalDate rentalEndDate;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "deposit", nullable = false)
    private BigDecimal deposit;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_status", nullable = false)
    @Builder.Default
    private ReturnStatus returnStatus = ReturnStatus.NOT_RETURNED;

    @Column(name = "late_fee")
    @Builder.Default
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(name = "damage_fee")
    @Builder.Default
    private BigDecimal damageFee = BigDecimal.ZERO;

    @Column(name = "refunded_amount")
    @Builder.Default
    private BigDecimal refundedAmount = BigDecimal.ZERO;
}
