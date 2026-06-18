package com.aurafit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "costume_handovers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CostumeHandover {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_id", nullable = false)
    @ToString.Exclude
    private RentalOrder rentalOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_detail_id", nullable = false)
    @ToString.Exclude
    private RentalOrderDetail rentalOrderDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_item_id", nullable = false)
    @ToString.Exclude
    private CostumeItem costumeItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    @ToString.Exclude
    private User staff;

    @Column(nullable = false)
    private String type;

    @Column(name = "return_status")
    private String returnStatus;

    @Column(name = "handover_image_url", columnDefinition = "TEXT")
    private String handoverImageUrl;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
