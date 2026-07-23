package com.aurafit.common.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Generic wrapper for paginated API responses.
 * Decouples the controller layer from Spring Data's {@link Page} object,
 * providing a clean, framework-agnostic JSON contract for the frontend.
 *
 * @param <T> The DTO type contained in this page (e.g. CostumeDTO).
 */
public record PaginatedResponse<T>(
        List<T> content,
        int pageNo,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean last
) {
    /**
     * Converts a Spring Data {@link Page} of entities into a {@link PaginatedResponse}
     * of DTOs, using the provided mapping function.
     *
     * <p>Usage example:
     * <pre>{@code
     * Page<Costume> page = costumeRepository.findAllWithFilters(...);
     * PaginatedResponse<CostumeDTO> response = PaginatedResponse.from(page, CostumeDTO::fromEntity);
     * }</pre>
     *
     * @param page   The Spring Data Page result from the repository.
     * @param mapper A function that converts each entity to its DTO (e.g. CostumeDTO::fromEntity).
     * @return A new PaginatedResponse containing the mapped DTOs and pagination metadata.
     */
    public static <E, D> PaginatedResponse<D> from(Page<E> page, Function<E, D> mapper) {
        List<D> content = page.getContent()
                .stream()
                .map(mapper)
                .toList();

        return new PaginatedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
