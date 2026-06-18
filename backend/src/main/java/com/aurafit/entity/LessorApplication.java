package com.aurafit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lessor_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessorApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Column(name = "shop_name", nullable = false)
    private String shopName;

    @Column(name = "shop_address", nullable = false)
    private String shopAddress;

    @Column(name = "citizen_id_image_url", nullable = false)
    private String citizenIdImageUrl;

    @Column(name = "bank_account_number", nullable = false)
    private String bankAccountNumber;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    @ToString.Exclude
    private User reviewedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
