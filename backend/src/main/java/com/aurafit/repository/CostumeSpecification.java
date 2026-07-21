package com.aurafit.repository;

import com.aurafit.dto.request.StylistFilterCriteria;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.CostumeMetadata;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

public final class CostumeSpecification {

    private CostumeSpecification() {
    }

    public static Specification<Costume> build(StylistFilterCriteria criteria) {
        StylistFilterCriteria safeCriteria = criteria == null ? StylistFilterCriteria.empty() : criteria;

        Specification<Costume> criteriaSpecification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(safeCriteria.category())) {
                Join<Costume, Category> categoryJoin = categoryJoin(root);
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
                Join<Costume, CostumeMetadata> metadataJoin = metadataJoin(root);
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

        return Specification.where(activeAndCategoryActive())
                .and(hasAvailableStock())
                .and(criteriaSpecification);
    }

    public static Specification<Costume> activeAndCategoryActive() {
        return (root, query, criteriaBuilder) -> {
            Join<Costume, Category> categoryJoin = categoryJoin(root);
            return criteriaBuilder.and(
                    criteriaBuilder.equal(root.get("status"), CostumeStatus.ACTIVE),
                    criteriaBuilder.isTrue(categoryJoin.get("isActive"))
            );
        };
    }

    private static Specification<Costume> hasAvailableStock() {
        return (root, query, criteriaBuilder) -> {
            Join<Costume, CostumeItem> itemJoin = root.join("items", JoinType.INNER);
            query.distinct(true);
            return criteriaBuilder.equal(itemJoin.get("status"), ItemStatus.AVAILABLE);
        };
    }

    public static Specification<Costume> buildRelaxed(
            StylistFilterCriteria criteria,
            List<String> searchTerms
    ) {
        StylistFilterCriteria safeCriteria = criteria == null ? StylistFilterCriteria.empty() : criteria;
        List<String> normalizedTerms = normalizeValues(searchTerms);

        Specification<Costume> relaxedSpecification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Costume, Category> categoryJoin = categoryJoin(root);

            if (StringUtils.hasText(safeCriteria.category())) {
                String categoryPath = normalize(safeCriteria.category());
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.equal(criteriaBuilder.lower(categoryJoin.get("path")), categoryPath),
                        criteriaBuilder.like(criteriaBuilder.lower(categoryJoin.get("path")), categoryPath + "/%")
                ));
            }

            if (safeCriteria.minBudget() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("rentalPrice"), safeCriteria.minBudget()));
            }
            if (safeCriteria.maxBudget() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("rentalPrice"), safeCriteria.maxBudget()));
            }

            if (!normalizedTerms.isEmpty()) {
                Join<Costume, CostumeMetadata> metadataJoin = root.join("metadata", JoinType.LEFT);
                Join<CostumeMetadata, String> tagsJoin = metadataJoin.join("tags", JoinType.LEFT);
                List<Predicate> searchPredicates = new ArrayList<>();

                for (String term : normalizedTerms) {
                    String pattern = "%" + term + "%";
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern));
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(categoryJoin.get("name")), pattern));
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(categoryJoin.get("path")), pattern));
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(metadataJoin.get("style")), pattern));
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(metadataJoin.get("occasion")), pattern));
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(metadataJoin.get("season")), pattern));
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(metadataJoin.get("color")), pattern));
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(metadataJoin.get("gender")), pattern));
                    searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(tagsJoin), pattern));
                }

                predicates.add(criteriaBuilder.or(searchPredicates.toArray(Predicate[]::new)));
                query.distinct(true);
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        return Specification.where(activeAndCategoryActive())
                .and(hasAvailableStock())
                .and(relaxedSpecification);
    }

    public static Specification<Costume> inCategoryIds(List<Long> categoryIds) {
        List<Long> safeCategoryIds = normalizeIds(categoryIds);
        if (safeCategoryIds.isEmpty()) {
            return Specification.where(null);
        }

        return (root, query, criteriaBuilder) -> root.get("category").get("id").in(safeCategoryIds);
    }

    public static Specification<Costume> hasAnyStyle(List<String> styles) {
        return hasAnyMetadataValue("style", styles);
    }

    public static Specification<Costume> hasAnyOccasion(List<String> occasions) {
        return hasAnyMetadataValue("occasion", occasions);
    }

    public static Specification<Costume> hasAnySeason(List<String> seasons) {
        return hasAnyMetadataValue("season", seasons);
    }

    public static Specification<Costume> hasAnyColor(List<String> colors) {
        return hasAnyMetadataValue("color", colors);
    }

    public static Specification<Costume> excludeCostumeIds(List<Long> excludeIds) {
        List<Long> safeExcludeIds = normalizeIds(excludeIds);
        if (safeExcludeIds.isEmpty()) {
            return Specification.where(null);
        }

        return (root, query, criteriaBuilder) -> criteriaBuilder.not(root.get("id").in(safeExcludeIds));
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

    private static Specification<Costume> hasAnyMetadataValue(String field, List<String> values) {
        List<String> normalizedValues = normalizeValues(values);
        if (normalizedValues.isEmpty()) {
            return Specification.where(null);
        }

        return (root, query, criteriaBuilder) -> {
            Join<Costume, CostumeMetadata> metadataJoin = metadataJoin(root);
            return criteriaBuilder.lower(metadataJoin.<String>get(field)).in(normalizedValues);
        };
    }

    @SuppressWarnings("unchecked")
    private static Join<Costume, Category> categoryJoin(Root<Costume> root) {
        return root.getJoins().stream()
                .filter(join -> "category".equals(join.getAttribute().getName()))
                .map(join -> (Join<Costume, Category>) join)
                .findFirst()
                .orElseGet(() -> root.join("category", JoinType.INNER));
    }

    @SuppressWarnings("unchecked")
    private static Join<Costume, CostumeMetadata> metadataJoin(Root<Costume> root) {
        return root.getJoins().stream()
                .filter(join -> "metadata".equals(join.getAttribute().getName()))
                .map(join -> (Join<Costume, CostumeMetadata>) join)
                .findFirst()
                .orElseGet(() -> root.join("metadata", JoinType.INNER));
    }

    private static List<Long> normalizeIds(List<Long> ids) {
        if (ids == null) {
            return List.of();
        }

        return ids.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private static List<String> normalizeValues(List<String> values) {
        if (values == null) {
            return List.of();
        }

        return values.stream()
                .filter(StringUtils::hasText)
                .map(CostumeSpecification::normalize)
                .distinct()
                .toList();
    }

    private static String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
