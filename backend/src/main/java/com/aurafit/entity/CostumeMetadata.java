package com.aurafit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "costume_metadata")
public class CostumeMetadata extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_id", nullable = false, unique = true)
    private Costume costume;

    @Column(nullable = false)
    private String style;

    @Column(nullable = false)
    private String occasion;

    @Column(nullable = false)
    private String season;

    @Column(nullable = false)
    private String color;

    @Builder.Default
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "costume_metadata_tags", joinColumns = @JoinColumn(name = "costume_metadata_id"))
    @Column(name = "tag", nullable = false)
    private List<String> tags = new ArrayList<>();

    @Column(name = "skin_tone")
    private String skinTone;

    @Column(name = "body_type")
    private String bodyType;

    @Column(name = "gender_label")
    private String gender;

    @Column(name = "size_label")
    private String size;

    private String material;

    @Column(name = "fit_note", columnDefinition = "TEXT")
    private String fitNote;
}
