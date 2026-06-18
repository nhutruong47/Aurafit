package com.aurafit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "costume_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CostumeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_id", nullable = false)
    @ToString.Exclude
    private Costume costume;

    @Column(name = "sku_code", nullable = false, unique = true)
    private String skuCode;

    private String size;

    @Column(nullable = false)
    @Builder.Default
    private String status = "AVAILABLE";

    @Column(name = "condition_note", columnDefinition = "TEXT")
    private String conditionNote;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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
