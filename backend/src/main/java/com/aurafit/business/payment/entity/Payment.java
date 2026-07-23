package com.aurafit.business.payment.entity;

import com.aurafit.common.entity.BaseEntity;
import com.aurafit.business.order.entity.RentalOrder;
import com.aurafit.business.payment.enums.PaymentMethod;
import com.aurafit.business.payment.enums.PaymentStatus;
import com.aurafit.business.payment.enums.PaymentType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payments_rental_order_id_type_status", columnList = "rental_order_id, type, status"),
        @Index(name = "idx_payments_transaction_id", columnList = "transaction_id")
})
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_id", nullable = false)
    private RentalOrder rentalOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType type;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "transaction_id")
    private String transactionId;
}
