package com.aurafit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rental_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Column(name = "rental_date")
    private LocalDateTime rentalDate;

    @Column(name = "return_date")
    private LocalDateTime returnDate;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "total_deposit", precision = 12, scale = 2)
    private BigDecimal totalDeposit;

    @Column(name = "total_rental_fee", precision = 12, scale = 2)
    private BigDecimal totalRentalFee;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "rentalOrder", cascade = CascadeType.ALL)
    @Builder.Default
    @ToString.Exclude
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "rentalOrder", cascade = CascadeType.ALL)
    @Builder.Default
    @ToString.Exclude
    private List<RentalOrderDetail> details = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
