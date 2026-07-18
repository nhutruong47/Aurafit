package com.aurafit.entity;

import com.aurafit.enums.HandoverType;
import com.aurafit.enums.ReturnStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "handover_records", indexes = {
        @Index(name = "idx_handover_records_rental_order_detail_id_created_at", columnList = "rental_order_detail_id, created_at")
})
public class HandoverRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_detail_id", nullable = false)
    private RentalOrderDetail rentalOrderDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_user_id", nullable = false)
    private User staffUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "handover_type", nullable = false)
    private HandoverType handoverType;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_status", nullable = false)
    private ReturnStatus returnStatus;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String note;
}
