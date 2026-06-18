package com.aurafit.entity;

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
@Table(name = "rental_orders")
public class RentalOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "rental_start_date", nullable = false)
    private LocalDateTime rentalStartDate;

    @Column(name = "rental_end_date", nullable = false)
    private LocalDateTime rentalEndDate;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "total_deposit", nullable = false)
    private BigDecimal totalDeposit;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "rentalOrder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RentalOrderDetail> details = new ArrayList<>();

    @JsonIgnore
    @OneToOne(mappedBy = "rentalOrder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;
}
