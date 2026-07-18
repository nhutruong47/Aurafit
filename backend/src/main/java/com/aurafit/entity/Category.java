package com.aurafit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "categories",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_categories_path", columnNames = "path")
        },
        indexes = {
                @Index(name = "idx_categories_parent_id", columnList = "parent_id"),
                @Index(name = "idx_categories_path", columnList = "path"),
                @Index(name = "idx_categories_is_active", columnList = "is_active"),
                @Index(name = "idx_categories_parent_sort_order", columnList = "parent_id, sort_order")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục không được vượt quá 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Slug danh mục không được để trống")
    @Size(max = 120, message = "Slug danh mục không được vượt quá 120 ký tự")
    @Column(nullable = false, length = 120)
    private String slug;

    @NotBlank(message = "Đường dẫn danh mục không được để trống")
    @Size(max = 500, message = "Đường dẫn danh mục không được vượt quá 500 ký tự")
    @Column(nullable = false, length = 500)
    private String path;

    @Size(max = 1000, message = "Mô tả danh mục không được vượt quá 1000 ký tự")
    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(name = "sort_order", nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    private Integer sortOrder = 0;

    @Builder.Default
    @Column(name = "is_active", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive = true;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", foreignKey = @ForeignKey(name = "fk_categories_parent"))
    private Category parent;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<Category> children = new ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<Costume> costumes = new ArrayList<>();
}
