package com.aurafit.entity;

import com.aurafit.enums.CartStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "carts")
public class Cart extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CartStatus status = CartStatus.ACTIVE;

    @Builder.Default
    @Column(name = "total_value", nullable = false)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_rental_fee", nullable = false, columnDefinition = "numeric(38,2) default 0")
    private BigDecimal totalRentalFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_deposit", nullable = false, columnDefinition = "numeric(38,2) default 0")
    private BigDecimal totalDeposit = BigDecimal.ZERO;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();

    // ── Helper methods ───────────────────────────────────────
    /** Recalculates totalRentalFee, totalDeposit, and totalValue from all child CartItems. */
    public void recalculateTotal() {
        this.totalRentalFee = items.stream()
                .map(CartItem::getRentalFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalDeposit = items.stream()
                .map(CartItem::getDeposit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalValue = this.totalRentalFee.add(this.totalDeposit);
    }
}
