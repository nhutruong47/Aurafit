package com.aurafit.business.catalog.entity;

import com.aurafit.common.entity.BaseEntity;
import com.aurafit.business.catalog.enums.ClubStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "clubs")
public class Club extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(name = "membership_fee", nullable = false)
    private BigDecimal membershipFee;

    @Column(name = "discount_rate", nullable = false)
    private Double discountRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClubStatus status;
}
