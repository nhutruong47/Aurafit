package com.aurafit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rental_order_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalOrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_id", nullable = false)
    @ToString.Exclude
    private RentalOrder rentalOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_item_id", nullable = false)
    @ToString.Exclude
    private CostumeItem costumeItem;

    @Column(name = "rental_price", precision = 12, scale = 2)
    private BigDecimal rentalPrice;

    @Column(name = "deposit_price", precision = 12, scale = 2)
    private BigDecimal depositPrice;

    @Column(name = "return_status")
    private String returnStatus;
}
