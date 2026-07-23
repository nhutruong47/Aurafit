package com.aurafit.ai.enrichment.entity;

import com.aurafit.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_ai_metadata")
public class ProductAiMetadata extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "costume_id", nullable = false, unique = true)
    private Long costumeId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "color_tags_json", columnDefinition = "jsonb")
    private List<String> colorTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fit_tags_json", columnDefinition = "jsonb")
    private List<String> fitTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "gender_tags_json", columnDefinition = "jsonb")
    private List<String> genderTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "material_tags_json", columnDefinition = "jsonb")
    private List<String> materialTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "occasion_tags_json", columnDefinition = "jsonb")
    private List<String> occasionTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "season_tags_json", columnDefinition = "jsonb")
    private List<String> seasonTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "size_tags_json", columnDefinition = "jsonb")
    private List<String> sizeTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "style_tags_json", columnDefinition = "jsonb")
    private List<String> styleTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "trend_tags_json", columnDefinition = "jsonb")
    private List<String> trendTags;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "budget_tier")
    private String budgetTier;

    @Column(name = "created_by_email")
    private String createdByEmail;

    @Column(name = "formality_level")
    private String formalityLevel;

    @Column(name = "searchable_text", columnDefinition = "TEXT")
    private String searchableText;

    private String silhouette;

    @Column(name = "updated_by_email")
    private String updatedByEmail;
}
