package com.aurafit.entity;

import com.aurafit.enums.ItemStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "costume_items", indexes = {
        @Index(name = "idx_costume_items_costume_id_status_size_color", columnList = "costume_id, status, size, color")
})
public class CostumeItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private String size;

    @Column(nullable = false)
    private String color;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemStatus status = ItemStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_id", nullable = false)
    private Costume costume;
}
