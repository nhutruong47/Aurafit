package com.aurafit.business.recommendation.service.impl;

import com.aurafit.business.catalog.dto.response.CatalogCostumeDTO;
import com.aurafit.business.catalog.entity.Category;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeMetadata;
import com.aurafit.common.exception.ResourceNotFoundException;
import com.aurafit.business.catalog.repository.CategoryRepository;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.business.catalog.repository.specification.CostumeSpecification;
import com.aurafit.business.recommendation.service.RelatedProductService;
import com.aurafit.business.catalog.service.EventPricingService;
import com.aurafit.business.catalog.service.EventPricingService.ActiveEventOffer;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class RelatedProductServiceImpl implements RelatedProductService {

    private static final int DEFAULT_LIMIT = 8;
    private static final int MAX_LIMIT = 50;
    private static final int CANDIDATE_MULTIPLIER = 3;

    private final CostumeRepository costumeRepository;
    private final CategoryRepository categoryRepository;
    private final EventPricingService eventPricingService;

    public RelatedProductServiceImpl(CostumeRepository costumeRepository,
                                     CategoryRepository categoryRepository,
                                     EventPricingService eventPricingService) {
        this.costumeRepository = costumeRepository;
        this.categoryRepository = categoryRepository;
        this.eventPricingService = eventPricingService;
    }

    @Override
    public List<CatalogCostumeDTO> findRelatedCostumes(Long costumeId, int limit) {
        Costume source = costumeRepository.findByIdWithItems(costumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", costumeId));
        int safeLimit = normalizeLimit(limit);
        int candidateLimit = safeLimit * CANDIDATE_MULTIPLIER;

        List<Long> relatedCategoryIds = resolveRelatedCategoryIds(source.getCategory());
        Specification<Costume> categorySpec = Specification
                .where(CostumeSpecification.activeAndCategoryActive())
                .and(CostumeSpecification.inCategoryIds(relatedCategoryIds))
                .and(CostumeSpecification.excludeCostumeIds(List.of(costumeId)));

        LinkedHashSet<Long> candidateIds = new LinkedHashSet<>();
        costumeRepository.findAll(categorySpec, PageRequest.of(0, candidateLimit))
                .forEach(candidate -> candidateIds.add(candidate.getId()));

        CostumeMetadata sourceMetadata = source.getMetadata();
        if (candidateIds.size() < safeLimit && hasStyleOrOccasion(sourceMetadata)) {
            Specification<Costume> metadataMatchSpec = Specification
                    .where(CostumeSpecification.hasAnyStyle(singleValue(sourceMetadata.getStyle())))
                    .or(CostumeSpecification.hasAnyOccasion(singleValue(sourceMetadata.getOccasion())));
            Specification<Costume> expandedSpec = Specification
                    .where(CostumeSpecification.activeAndCategoryActive())
                    .and(metadataMatchSpec)
                    .and(CostumeSpecification.excludeCostumeIds(List.of(costumeId)));

            costumeRepository.findAll(expandedSpec, PageRequest.of(0, candidateLimit))
                    .forEach(candidate -> candidateIds.add(candidate.getId()));
        }

        if (candidateIds.isEmpty()) {
            return List.of();
        }

        List<Costume> hydratedCandidates = costumeRepository.findAllByIdWithMetadata(
                new ArrayList<>(candidateIds)
        );
        List<Costume> ranked = hydratedCandidates.stream()
                .map(candidate -> new ScoredCostume(candidate, similarityScore(source, candidate)))
                .sorted(Comparator.comparingDouble(ScoredCostume::score).reversed()
                        .thenComparing(
                                scored -> scored.costume().getAvailableItemCount(),
                                Comparator.reverseOrder()
                        ))
                .limit(safeLimit)
                .map(ScoredCostume::costume)
                .toList();

        List<Costume> relatedCostumes = loadItemsPreservingOrder(ranked);
        Map<Long, ActiveEventOffer> offersByCostumeId = eventPricingService.findActiveOffers(
                relatedCostumes.stream().map(Costume::getId).toList(),
                LocalDateTime.now()
        );
        return relatedCostumes.stream()
                .map(costume -> toCatalogCostumeDTO(costume, offersByCostumeId.get(costume.getId())))
                .toList();
    }

    private List<Long> resolveRelatedCategoryIds(Category category) {
        Set<Long> categoryIds = new LinkedHashSet<>();
        categoryIds.add(category.getId());

        if (category.getParent() != null) {
            categoryRepository.findByParentIdAndIsActiveTrueOrderBySortOrderAsc(category.getParent().getId())
                    .stream()
                    .map(Category::getId)
                    .forEach(categoryIds::add);
        }

        return new ArrayList<>(categoryIds);
    }

    private CatalogCostumeDTO toCatalogCostumeDTO(Costume costume, ActiveEventOffer activeOffer) {
        if (activeOffer == null) {
            return CatalogCostumeDTO.fromEntity(costume);
        }
        return CatalogCostumeDTO.fromEntity(
                costume,
                activeOffer.discountPercent(),
                activeOffer.finalPrice(),
                activeOffer.eventName()
        );
    }

    private double similarityScore(Costume source, Costume candidate) {
        double score = Objects.equals(source.getCategory().getId(), candidate.getCategory().getId()) ? 2.0 : 0.0;
        CostumeMetadata sourceMetadata = source.getMetadata();
        CostumeMetadata candidateMetadata = candidate.getMetadata();
        if (sourceMetadata == null || candidateMetadata == null) {
            return score;
        }

        score += sameNormalizedValue(sourceMetadata.getStyle(), candidateMetadata.getStyle()) ? 1.0 : 0.0;
        score += sameNormalizedValue(sourceMetadata.getOccasion(), candidateMetadata.getOccasion()) ? 1.0 : 0.0;
        score += sameNormalizedValue(sourceMetadata.getSeason(), candidateMetadata.getSeason()) ? 1.0 : 0.0;
        score += sameNormalizedValue(sourceMetadata.getColor(), candidateMetadata.getColor()) ? 1.0 : 0.0;

        Set<String> sourceTags = normalizeTags(sourceMetadata.getTags());
        long matchingTags = normalizeTags(candidateMetadata.getTags()).stream()
                .filter(sourceTags::contains)
                .count();
        return score + matchingTags * 0.5;
    }

    private List<Costume> loadItemsPreservingOrder(List<Costume> costumes) {
        if (costumes.isEmpty()) {
            return List.of();
        }

        List<Long> orderedIds = costumes.stream().map(Costume::getId).toList();
        Map<Long, Costume> byId = new LinkedHashMap<>();
        costumeRepository.findAllByIdWithItems(orderedIds)
                .forEach(costume -> byId.put(costume.getId(), costume));
        return orderedIds.stream().map(byId::get).filter(Objects::nonNull).toList();
    }

    private boolean hasStyleOrOccasion(CostumeMetadata metadata) {
        return metadata != null
                && (StringUtils.hasText(metadata.getStyle()) || StringUtils.hasText(metadata.getOccasion()));
    }

    private List<String> singleValue(String value) {
        return StringUtils.hasText(value) ? List.of(value) : List.of();
    }

    private boolean sameNormalizedValue(String left, String right) {
        return StringUtils.hasText(left)
                && StringUtils.hasText(right)
                && normalize(left).equals(normalize(right));
    }

    private Set<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return Set.of();
        }

        Set<String> normalized = new LinkedHashSet<>();
        tags.stream()
                .filter(StringUtils::hasText)
                .map(this::normalize)
                .forEach(normalized::add);
        return normalized;
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private int normalizeLimit(int requestedLimit) {
        if (requestedLimit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(requestedLimit, MAX_LIMIT);
    }

    private record ScoredCostume(Costume costume, double score) {
    }
}
