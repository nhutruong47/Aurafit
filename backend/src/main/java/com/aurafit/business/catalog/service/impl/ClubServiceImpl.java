package com.aurafit.business.catalog.service.impl;

import com.aurafit.business.catalog.dto.request.ClubCreateRequest;
import com.aurafit.business.catalog.dto.request.ClubUpdateRequest;
import com.aurafit.business.catalog.dto.response.ClubDTO;
import com.aurafit.common.dto.response.PaginatedResponse;
import com.aurafit.business.catalog.entity.Club;
import com.aurafit.business.catalog.enums.ClubStatus;
import com.aurafit.common.exception.ConflictException;
import com.aurafit.common.exception.ResourceNotFoundException;
import com.aurafit.business.catalog.repository.ClubRepository;
import com.aurafit.business.catalog.service.ClubService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ClubServiceImpl implements ClubService {

    private final ClubRepository clubRepository;

    public ClubServiceImpl(ClubRepository clubRepository) {
        this.clubRepository = clubRepository;
    }

    @Override
    @Transactional
    public ClubDTO createClub(ClubCreateRequest request) {
        if (clubRepository.existsByName(request.name())) {
            throw new ConflictException("Club name already exists: " + request.name());
        }

        Club club = Club.builder()
                .name(request.name())
                .description(request.description())
                .membershipFee(request.membershipFee())
                .discountRate(request.discountRate())
                .status(request.status())
                .build();

        return ClubDTO.fromEntity(clubRepository.save(club));
    }

    @Override
    @Transactional
    public ClubDTO updateClub(Long id, ClubUpdateRequest request) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", id));

        if (request.name() != null && !request.name().equalsIgnoreCase(club.getName())) {
            if (clubRepository.existsByName(request.name())) {
                throw new ConflictException("Club name already exists: " + request.name());
            }
            club.setName(request.name());
        }

        if (request.description() != null) {
            club.setDescription(request.description());
        }

        if (request.membershipFee() != null) {
            club.setMembershipFee(request.membershipFee());
        }

        if (request.discountRate() != null) {
            club.setDiscountRate(request.discountRate());
        }

        if (request.status() != null) {
            club.setStatus(request.status());
        }

        return ClubDTO.fromEntity(clubRepository.save(club));
    }

    @Override
    @Transactional
    public void deleteClub(Long id) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", id));
        clubRepository.delete(club);
    }

    @Override
    public ClubDTO getClubById(Long id) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", id));
        return ClubDTO.fromEntity(club);
    }

    @Override
    public PaginatedResponse<ClubDTO> searchClubs(String keyword, ClubStatus status, Double minDiscountRate,
                                                  int pageNo, int pageSize, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);

        Specification<Club> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.trim().isEmpty()) {
                String search = "%" + keyword.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), search);
                Predicate descLike = cb.like(cb.lower(root.get("description")), search);
                predicates.add(cb.or(nameLike, descLike));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (minDiscountRate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("discountRate"), minDiscountRate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Club> page = clubRepository.findAll(spec, pageable);
        return PaginatedResponse.from(page, ClubDTO::fromEntity);
    }
}
