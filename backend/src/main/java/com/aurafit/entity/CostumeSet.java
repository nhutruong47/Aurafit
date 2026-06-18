package com.aurafit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "costume_sets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CostumeSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "set_rental_price", precision = 12, scale = 2)
    private BigDecimal setRentalPrice;

    @Column(name = "set_deposit_price", precision = 12, scale = 2)
    private BigDecimal setDepositPrice;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToMany
    @JoinTable(
            name = "costume_set_items",
            joinColumns = @JoinColumn(name = "set_id"),
            inverseJoinColumns = @JoinColumn(name = "costume_id")
    )
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JsonIgnore
    private Set<Costume> costumes = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
