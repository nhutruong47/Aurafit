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

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();

    // ── Helper methods ───────────────────────────────────────
    /** Recalculates totalValue from all child CartItems. */
    public void recalculateTotal() {
        this.totalValue = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
