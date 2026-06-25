package com.aurafit.entity;

import com.aurafit.enums.FashionTrendSourceType;
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
@Table(name = "fashion_trends")
public class FashionTrend extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trend_name", nullable = false)
    private String trendName;

    @Column(name = "season_label")
    private String seasonLabel;

    @Lob
    @Column(name = "style_tags_json", columnDefinition = "TEXT")
    private String styleTagsJson;

    @Lob
    @Column(name = "color_tags_json", columnDefinition = "TEXT")
    private String colorTagsJson;

    @Lob
    @Column(name = "occasion_tags_json", columnDefinition = "TEXT")
    private String occasionTagsJson;

    @Lob
    @Column(name = "audience_tags_json", columnDefinition = "TEXT")
    private String audienceTagsJson;

    @Column(name = "boost_score", nullable = false)
    private BigDecimal boostScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private FashionTrendSourceType sourceType;

    @Column(name = "source_note", columnDefinition = "TEXT")
    private String sourceNote;

    @Lob
    @Column(name = "summary_text", columnDefinition = "TEXT")
    private String summaryText;

    @Column(name = "active_from")
    private LocalDateTime activeFrom;

    @Column(name = "active_to")
    private LocalDateTime activeTo;

    @Column(name = "created_by_email")
    private String createdByEmail;

    @Column(name = "updated_by_email")
    private String updatedByEmail;
}
