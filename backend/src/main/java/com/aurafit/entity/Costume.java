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
@Table(name = "costumes", indexes = {
        @Index(name = "idx_costumes_category_id_status", columnList = "category_id, status"),
        @Index(name = "idx_costumes_status_id", columnList = "status, id")
})
public class Costume extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "rental_price", nullable = false)
    private BigDecimal rentalPrice;

    @Column(name = "deposit_price", nullable = false)
    private BigDecimal depositPrice;

    @Column(name = "image_url_legacy")
    private String imageUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CostumeStatus status = CostumeStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;



    @OneToOne(mappedBy = "costume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private CostumeMetadata metadata;

    @Builder.Default
    @OneToMany(mappedBy = "costume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<CostumeImage> images = new ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "costume", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CostumeItem> items = new ArrayList<>();

    @org.hibernate.annotations.Formula("(SELECT COUNT(i.id) FROM costume_items i WHERE i.costume_id = id AND i.status = 'AVAILABLE')")
    private int availableItemCount;

    @Transient
    public String getPrimaryImageUrl() {
        if (images == null || images.isEmpty()) {
            return imageUrl;
        }

        return images.stream()
                .sorted(java.util.Comparator.comparing(
                        CostumeImage::getDisplayOrder,
                        java.util.Comparator.nullsLast(Integer::compareTo)
                ))
                .filter(CostumeImage::isPrimary)
                .map(CostumeImage::getImageUrl)
                .findFirst()
                .orElseGet(() -> images.stream()
                        .sorted(java.util.Comparator.comparing(
                                CostumeImage::getDisplayOrder,
                                java.util.Comparator.nullsLast(Integer::compareTo)
                        ))
                        .map(CostumeImage::getImageUrl)
                        .findFirst()
                        .orElse(imageUrl));
    }

    @Transient
    public List<String> getAllImageUrls() {
        if (images == null || images.isEmpty()) {
            return imageUrl != null ? List.of(imageUrl) : List.of();
        }

        return images.stream()
                .sorted(java.util.Comparator.comparing(
                        CostumeImage::getDisplayOrder,
                        java.util.Comparator.nullsLast(Integer::compareTo)
                ))
                .map(CostumeImage::getImageUrl)
                .toList();
    }
}
