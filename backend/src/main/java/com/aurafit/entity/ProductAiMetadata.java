package com.aurafit.entity;

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
@Table(
        name = "product_ai_metadata",
        uniqueConstraints = @UniqueConstraint(name = "uk_product_ai_metadata_costume", columnNames = "costume_id")
)
public class ProductAiMetadata extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_id", nullable = false)
    private Costume costume;

    @Lob
    @Column(name = "style_tags_json", columnDefinition = "TEXT")
    private String styleTagsJson;

    @Lob
    @Column(name = "occasion_tags_json", columnDefinition = "TEXT")
    private String occasionTagsJson;

    @Lob
    @Column(name = "trend_tags_json", columnDefinition = "TEXT")
    private String trendTagsJson;

    @Lob
    @Column(name = "size_tags_json", columnDefinition = "TEXT")
    private String sizeTagsJson;

    @Lob
    @Column(name = "color_tags_json", columnDefinition = "TEXT")
    private String colorTagsJson;

    @Lob
    @Column(name = "season_tags_json", columnDefinition = "TEXT")
    private String seasonTagsJson;

    @Lob
    @Column(name = "gender_tags_json", columnDefinition = "TEXT")
    private String genderTagsJson;

    @Lob
    @Column(name = "material_tags_json", columnDefinition = "TEXT")
    private String materialTagsJson;

    @Lob
    @Column(name = "fit_tags_json", columnDefinition = "TEXT")
    private String fitTagsJson;

    @Column(name = "budget_tier")
    private String budgetTier;

    @Column(name = "silhouette")
    private String silhouette;

    @Column(name = "formality_level")
    private String formalityLevel;

    @Lob
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Lob
    @Column(name = "searchable_text", columnDefinition = "TEXT")
    private String searchableText;

    @Column(name = "created_by_email")
    private String createdByEmail;

    @Column(name = "updated_by_email")
    private String updatedByEmail;
}
