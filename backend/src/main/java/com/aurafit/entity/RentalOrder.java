package com.aurafit.entity;

import com.aurafit.enums.DeliveryMethod;
import com.aurafit.enums.OrderStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "rental_orders", indexes = {
        @Index(name = "idx_rental_orders_user_id_created_at", columnList = "user_id, created_at"),
        @Index(name = "idx_rental_orders_status_created_at", columnList = "status, created_at"),
        @Index(name = "idx_rental_orders_created_at", columnList = "created_at")
})
public class RentalOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;



    @Column(name = "receiver_name", nullable = false)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false)
    private String receiverPhone;

    @Column(name = "delivery_address", nullable = false, columnDefinition = "TEXT")
    private String deliveryAddress;

    @Column(name = "district_id")
    private Integer districtId;

    @Column(name = "ward_code")
    private String wardCode;

    @Column(name = "total_rental_price", nullable = false)
    private BigDecimal totalRentalPrice;

    @Column(name = "total_deposit", nullable = false)
    private BigDecimal totalDeposit;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_method")
    private DeliveryMethod deliveryMethod;

    @Builder.Default
    @Column(name = "shipping_fee", nullable = false)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "ghn_order_code")
    private String ghnOrderCode;

    @Column(name = "ghn_return_order_code")
    private String ghnReturnOrderCode;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "total_late_fee")
    @Builder.Default
    private BigDecimal totalLateFee = BigDecimal.ZERO;

    @Column(name = "total_damage_fee")
    @Builder.Default
    private BigDecimal totalDamageFee = BigDecimal.ZERO;

    @Column(name = "total_refunded_amount")
    @Builder.Default
    private BigDecimal totalRefundedAmount = BigDecimal.ZERO;

    @Column(name = "inspection_note", columnDefinition = "TEXT")
    private String inspectionNote;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "rentalOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<RentalOrderDetail> details = new ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "rentalOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Payment> payments = new ArrayList<>();
}
