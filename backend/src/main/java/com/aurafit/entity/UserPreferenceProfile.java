package com.aurafit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "user_preference_profiles",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_preference_profiles_user", columnNames = "user_id")
)
public class UserPreferenceProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Lob
    @Column(name = "preferred_styles_json", columnDefinition = "TEXT")
    private String preferredStylesJson;

    @Lob
    @Column(name = "preferred_occasions_json", columnDefinition = "TEXT")
    private String preferredOccasionsJson;

    @Lob
    @Column(name = "preferred_colors_json", columnDefinition = "TEXT")
    private String preferredColorsJson;

    @Lob
    @Column(name = "preferred_sizes_json", columnDefinition = "TEXT")
    private String preferredSizesJson;

    @Lob
    @Column(name = "preferred_categories_json", columnDefinition = "TEXT")
    private String preferredCategoriesJson;

    @Lob
    @Column(name = "gender_affinity_json", columnDefinition = "TEXT")
    private String genderAffinityJson;

    @Column(name = "preferred_budget_min")
    private BigDecimal preferredBudgetMin;

    @Column(name = "preferred_budget_max")
    private BigDecimal preferredBudgetMax;

    @Lob
    @Column(name = "profile_summary_text", columnDefinition = "TEXT")
    private String profileSummaryText;

    @Column(name = "profile_version")
    private Integer profileVersion;

    @Column(name = "last_computed_at")
    private LocalDateTime lastComputedAt;
}
