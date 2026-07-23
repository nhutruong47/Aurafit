package com.aurafit.business.order.entity;

import com.aurafit.common.entity.BaseEntity;
import com.aurafit.business.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "promotions")
public class Promotion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    @Column(name = "max_discount", nullable = false)
    private BigDecimal maxDiscount;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    public enum PromotionStatus {
        ACTIVE, USED, EXPIRED
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PromotionStatus status = PromotionStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
