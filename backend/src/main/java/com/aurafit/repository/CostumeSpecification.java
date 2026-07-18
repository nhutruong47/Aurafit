package com.aurafit.repository;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.enums.CostumeStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class CostumeSpecification {

    private CostumeSpecification() {
    }

    public static Specification<Costume> build(StylistFilterCriteria criteria) {
        StylistFilterCriteria safeCriteria = criteria == null ? StylistFilterCriteria.empty() : criteria;

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Costume, Category> categoryJoin = root.join("category", JoinType.INNER);

            predicates.add(criteriaBuilder.equal(root.get("status"), CostumeStatus.ACTIVE));
            predicates.add(criteriaBuilder.isTrue(categoryJoin.get("isActive")));

            if (StringUtils.hasText(safeCriteria.category())) {
                String categoryPath = normalize(safeCriteria.category());
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.equal(criteriaBuilder.lower(categoryJoin.get("path")), categoryPath),
                        criteriaBuilder.like(criteriaBuilder.lower(categoryJoin.get("path")), categoryPath + "/%")
                ));
            }

            boolean hasMetadataFilters = StringUtils.hasText(safeCriteria.style())
                    || StringUtils.hasText(safeCriteria.occasion())
                    || StringUtils.hasText(safeCriteria.season())
                    || StringUtils.hasText(safeCriteria.color())
                    || StringUtils.hasText(safeCriteria.gender())
                    || hasTags(safeCriteria.tags());

            if (hasMetadataFilters) {
                Join<Costume, CostumeMetadata> metadataJoin = root.join("metadata", JoinType.INNER);
                addTextPredicate(predicates, criteriaBuilder, metadataJoin, "style", safeCriteria.style());
                addTextPredicate(predicates, criteriaBuilder, metadataJoin, "occasion", safeCriteria.occasion());
                addTextPredicate(predicates, criteriaBuilder, metadataJoin, "season", safeCriteria.season());
                addTextPredicate(predicates, criteriaBuilder, metadataJoin, "color", safeCriteria.color());
                addTextPredicate(predicates, criteriaBuilder, metadataJoin, "gender", safeCriteria.gender());

                if (hasTags(safeCriteria.tags())) {
                    Join<CostumeMetadata, String> tagsJoin = metadataJoin.join("tags", JoinType.INNER);
                    List<String> normalizedTags = safeCriteria.tags().stream()
                            .filter(StringUtils::hasText)
                            .map(CostumeSpecification::normalize)
                            .distinct()
                            .toList();
                    predicates.add(criteriaBuilder.lower(tagsJoin).in(normalizedTags));
                    query.distinct(true);
                }
            }

            if (safeCriteria.minBudget() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("rentalPrice"), safeCriteria.minBudget()));
            }
            if (safeCriteria.maxBudget() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("rentalPrice"), safeCriteria.maxBudget()));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static void addTextPredicate(
            List<Predicate> predicates,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            Join<Costume, CostumeMetadata> metadataJoin,
            String field,
            String value
    ) {
        if (StringUtils.hasText(value)) {
            predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(metadataJoin.get(field)),
                    normalize(value)
            ));
        }
    }

    private static boolean hasTags(List<String> tags) {
        return tags != null && tags.stream().anyMatch(StringUtils::hasText);
    }

    private static String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
