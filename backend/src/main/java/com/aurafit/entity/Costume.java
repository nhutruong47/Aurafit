package com.aurafit.entity;

import com.aurafit.enums.CostumeStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "costumes")
public class Costume extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "rental_price", nullable = false)
    private BigDecimal rentalPrice;

    @Column(name = "deposit_price", nullable = false)
    private BigDecimal depositPrice;

    private String imageUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CostumeStatus status = CostumeStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private User owner;

    @OneToOne(mappedBy = "costume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private CostumeMetadata metadata;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "costume", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CostumeItem> items = new ArrayList<>();
}
